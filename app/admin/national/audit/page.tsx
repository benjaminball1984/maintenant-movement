import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Badge, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import {
  chargerIdentitesAffichables,
  nomAffichageRespectantVisibilite,
} from '@/lib/reseau/identite';
import { getSupabaseServer } from '@/lib/supabase';
import { History } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Audit — Journal D8bis',
  description: 'Toutes les transitions de réservation (D8bis V2.3.15) consultables par les admins.',
};

/**
 * Page admin d'audit du journal des transitions D8bis (V2.3.43, V2.3.15).
 *
 * Lecture seule. Affiche les 200 dernières entrées du `reservation_journal`
 * avec auteur (visibilité respectée), date, transition statutAvant →
 * statutApres et motif.
 *
 * Utile pour le contrôle de la modération : on peut voir qui a fait
 * quoi sur quelle réservation, et quand.
 */
export default async function PageAuditJournal() {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('reservation_journal')
    .select('*')
    .order('changed_at', { ascending: false })
    .limit(200);

  const entrees = data ?? [];

  const idsAuteurs = new Set<string>();
  for (const e of entrees) if (e.auteur_id !== null) idsAuteurs.add(e.auteur_id);
  const identitesParId = await chargerIdentitesAffichables([...idsAuteurs]);
  const [estAdmin, titre, intro] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('admin.national.audit.titre', {
      valeurMd: 'Audit — Journal des transitions D8',
    }),
    lireContenuEditorial('admin.national.audit.intro', {
      valeurMd:
        '200 dernières transitions de réservation (V2.3.15). Inclut les actions de toutes les parties : demandeur, propriétaire, admin. Lecture seule.',
    }),
  ]);

  return (
    <>
      <Heading niveau={1}>
        <History size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
        <TexteEditableAdmin
          cle="admin.national.audit.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre console audit"
          longueurMax={60}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>
      </Heading>
      <TexteEditableAdmin
        cle="admin.national.audit.intro"
        valeurInitiale={intro.valeurMd}
        estAdmin={estAdmin}
        libelle="intro console audit"
        multilignes
        longueurMax={300}
      >
        {(t) => <p className="mt-2 text-sm text-text-3">{t}</p>}
      </TexteEditableAdmin>

      {entrees.length === 0 ? (
        <p className="mt-6 text-text-2">Aucune entrée dans le journal pour le moment.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {entrees.map((e) => (
            <li key={e.id}>
              <Card variant="ombre" className="grid gap-1 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{LIBELLE_STATUT[e.statut_avant]}</Badge>
                    <span aria-hidden="true">→</span>
                    <Badge variant={VARIANT[e.statut_apres]}>
                      {LIBELLE_STATUT[e.statut_apres]}
                    </Badge>
                  </div>
                  <span className="text-text-3 text-xs">
                    {FORMATEUR.format(new Date(e.changed_at))}
                  </span>
                </div>
                <p className="text-text-3 text-xs">
                  Par{' '}
                  {e.auteur_id !== null
                    ? nomAffichageRespectantVisibilite(identitesParId.get(e.auteur_id))
                    : 'système'}
                  {' · '}
                  <Link
                    href="/admin/moderation/reservations"
                    className="text-brand hover:underline"
                  >
                    réservation {e.reservation_id.slice(0, 8)}…
                  </Link>
                </p>
                {e.motif !== null && e.motif !== '' ? (
                  <p className="text-text-2 italic">« {e.motif} »</p>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

const LIBELLE_STATUT: Record<string, string> = {
  proposee: 'Proposée',
  acceptee: 'Acceptée',
  refusee: 'Refusée',
  realisee: 'Réalisée',
  confirmee: 'Confirmée',
  annulee: 'Annulée',
  litige: 'Litige',
};

const VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  proposee: 'warning',
  acceptee: 'success',
  refusee: 'danger',
  realisee: 'info',
  confirmee: 'success',
  annulee: 'default',
  litige: 'danger',
};

const FORMATEUR = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
