import { retirerMoment } from '@/app/(public)/agir/moments-solidaires/actions';
import { ControleModeration } from '@/components/admin/moderation/ControleModeration';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { getSupabaseServer } from '@/lib/supabase';
import Link from 'next/link';

export default async function PageModerationMoments() {
  const supabase = await getSupabaseServer();
  const [{ data }, estAdmin, titre, intro] = await Promise.all([
    supabase
      .from('moment_solidaire')
      .select('id, slug, titre, type, statut, commence_le')
      .is('parent_id', null)
      .order('commence_le', { ascending: true })
      .limit(100),
    estAdminCourant(),
    lireContenuEditorial('admin.moderation.moments.titre', {
      valeurMd: 'Modération — Moments solidaires',
    }),
    lireContenuEditorial('admin.moderation.moments.intro', {
      valeurMd:
        "Moments à venir. Retire un moment problématique (un motif est demandé et tracé au journal d'audit).",
    }),
  ]);
  const moments = data ?? [];
  return (
    <>
      <TexteEditableAdmin
        cle="admin.moderation.moments.titre"
        valeurInitiale={titre.valeurMd}
        estAdmin={estAdmin}
        libelle="titre console moments"
        longueurMax={60}
      >
        {(t) => <Heading niveau={1}>{t}</Heading>}
      </TexteEditableAdmin>
      <TexteEditableAdmin
        cle="admin.moderation.moments.intro"
        valeurInitiale={intro.valeurMd}
        estAdmin={estAdmin}
        libelle="intro console moments"
        multilignes
        longueurMax={300}
      >
        {(t) => <p className="mt-2 text-sm text-text-3">{t}</p>}
      </TexteEditableAdmin>
      {moments.length === 0 ? (
        <Alert variant="info" titre="Aucun moment">
          Pas de moment programmé pour l'instant.
        </Alert>
      ) : (
        <ul className="mt-6 grid gap-2">
          {moments.map((m) => (
            <li key={m.id}>
              <Card variant="ombre" className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Badge variant="default">{m.type}</Badge>
                    <p className="mt-1 font-bold text-text-1">
                      <Link
                        href={`/agir/moments-solidaires/${m.slug}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {m.titre}
                      </Link>
                    </p>
                    <p className="text-xs text-text-3">
                      {new Date(m.commence_le).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Badge variant={m.statut === 'annonce' ? 'info' : 'default'}>{m.statut}</Badge>
                </div>
                {m.statut !== 'retire' ? (
                  <ControleModeration
                    actions={[
                      {
                        libelle: 'Retirer',
                        action: retirerMoment,
                        champId: 'moment_id',
                        id: m.id,
                        champRaison: 'raison',
                        placeholderRaison: 'Motif du retrait, au moins 10 caractères.',
                        messageSucces: 'Moment retiré.',
                      },
                    ]}
                  />
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
