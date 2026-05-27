import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { LIMITES } from '@/config/limites';
import { estAdminCourant } from '@/lib/auth/admin';
import { getPersonneOuRediriger } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { getSupabaseServer } from '@/lib/supabase';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mes communes',
};

const FALLBACKS = {
  titre: 'Mes communes',
  introAmorce: 'Tu peux appartenir à',
  introMilieu: 'communes maximum',
  emptyTitre: 'Tu n’appartiens à aucune commune',
  emptyCorps:
    'Pour rejoindre une commune, va sur la page Agir > Communes (à venir au chantier 5.2). On part du réel, on ne part pas de coquille vide.',
  badgeActive: 'Active',
  rejointeLe: 'Rejointe le',
};

/**
 * Liste les appartenances actives de la personne à des communes libres.
 *
 * Limite : 3 communes actives maximum (cf. trigger SQL `appartenance_commune_max_actives`).
 * Anti-spam : 1 transition par mois glissant.
 *
 * Le bouton « Rejoindre une commune » mène à `/agir/communes` (chantier 5.2).
 * Tant que cette page n'existe pas, on affiche un état d'attente.
 */
export default async function PageCommunes() {
  const { userId } = await getPersonneOuRediriger('/profil/communes');
  const supabase = await getSupabaseServer();
  const [
    estAdmin,
    titre,
    introAmorce,
    introMilieu,
    emptyTitre,
    emptyCorps,
    badgeActive,
    rejointeLe,
  ] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('profil.communes.titre', { valeurMd: FALLBACKS.titre }),
    lireContenuEditorial('profil.communes.intro_amorce', { valeurMd: FALLBACKS.introAmorce }),
    lireContenuEditorial('profil.communes.intro_milieu', { valeurMd: FALLBACKS.introMilieu }),
    lireContenuEditorial('profil.communes.empty_titre', { valeurMd: FALLBACKS.emptyTitre }),
    lireContenuEditorial('profil.communes.empty_corps', { valeurMd: FALLBACKS.emptyCorps }),
    lireContenuEditorial('profil.communes.badge_active', { valeurMd: FALLBACKS.badgeActive }),
    lireContenuEditorial('profil.communes.rejointe_le', { valeurMd: FALLBACKS.rejointeLe }),
  ]);

  // Deux requêtes séparées plutôt qu'une jointure : les `Relationships`
  // typés Supabase seront peuplés par `supabase gen types` une fois
  // l'instance live. D'ici là, on fait simple et explicite.
  const { data: appartenances } = await supabase
    .from('appartenance_commune')
    .select('id, commune_id, rejointe_le')
    .eq('personne_id', userId)
    .eq('est_active', true)
    .order('rejointe_le', { ascending: false });

  const liste = appartenances ?? [];
  const idsCommunes = liste.map((a) => a.commune_id);

  const { data: communes } =
    idsCommunes.length === 0
      ? { data: [] }
      : await supabase.from('commune').select('id, slug, nom, departement').in('id', idsCommunes);

  const indexCommunes = new Map((communes ?? []).map((c) => [c.id, c]));

  return (
    <article className="grid gap-6">
      <header>
        <TexteEditableAdmin
          cle="profil.communes.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre page mes communes"
          longueurMax={40}
        >
          {(t) => <Heading niveau={1}>{t}</Heading>}
        </TexteEditableAdmin>
        <p className="mt-2 text-text-2">
          <TexteEditableAdmin
            cle="profil.communes.intro_amorce"
            valeurInitiale={introAmorce.valeurMd}
            estAdmin={estAdmin}
            libelle="amorce intro (avant la limite)"
            longueurMax={50}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>{' '}
          {LIMITES.commune.maximumParPersonne}{' '}
          <TexteEditableAdmin
            cle="profil.communes.intro_milieu"
            valeurInitiale={introMilieu.valeurMd}
            estAdmin={estAdmin}
            libelle="milieu intro (apres la limite)"
            longueurMax={50}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>{' '}
          ({liste.length}/{LIMITES.commune.maximumParPersonne}).
        </p>
      </header>

      {liste.length === 0 ? (
        <Alert
          variant="info"
          titre={
            <TexteEditableAdmin
              cle="profil.communes.empty_titre"
              valeurInitiale={emptyTitre.valeurMd}
              estAdmin={estAdmin}
              libelle="titre empty mes communes"
              longueurMax={60}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          }
        >
          <TexteEditableAdmin
            cle="profil.communes.empty_corps"
            valeurInitiale={emptyCorps.valeurMd}
            estAdmin={estAdmin}
            libelle="corps empty mes communes"
            multilignes
            longueurMax={400}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </Alert>
      ) : (
        <div className="grid gap-3">
          {liste.map((appartenance) => {
            const commune = indexCommunes.get(appartenance.commune_id);
            if (commune === undefined) {
              return null;
            }
            return (
              <Card key={appartenance.id} variant="ombre">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      <Link
                        href={`/agir/communes/${commune.slug}`}
                        className="text-text-1 underline-offset-4 hover:underline"
                      >
                        {commune.nom}
                      </Link>
                    </p>
                    {commune.departement !== null ? (
                      <p className="text-sm text-text-3">{commune.departement}</p>
                    ) : null}
                  </div>
                  <TexteEditableAdmin
                    cle="profil.communes.badge_active"
                    valeurInitiale={badgeActive.valeurMd}
                    estAdmin={estAdmin}
                    libelle="badge Active"
                    longueurMax={20}
                  >
                    {(t) => <Badge variant="brand">{t}</Badge>}
                  </TexteEditableAdmin>
                </div>
                <p className="mt-2 text-xs text-text-3">
                  {rejointeLe.valeurMd}{' '}
                  {new Date(appartenance.rejointe_le).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </article>
  );
}
