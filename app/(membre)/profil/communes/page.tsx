import { Alert, Badge, Card, Heading } from '@/components/ui';
import { LIMITES } from '@/config/limites';
import { getPersonneOuRediriger } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mes communes',
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
        <Heading niveau={1}>Mes communes</Heading>
        <p className="mt-2 text-text-2">
          Tu peux appartenir à {LIMITES.commune.maximumParPersonne} communes maximum ({liste.length}
          /{LIMITES.commune.maximumParPersonne}).
        </p>
      </header>

      {liste.length === 0 ? (
        <Alert variant="info" titre="Tu n’appartiens à aucune commune">
          Pour rejoindre une commune, va sur la page <em>Agir &gt; Communes</em> (à venir au
          chantier 5.2). On part du réel, on ne part pas de coquille vide.
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
                  <Badge variant="brand">Active</Badge>
                </div>
                <p className="mt-2 text-xs text-text-3">
                  Rejointe le{' '}
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
