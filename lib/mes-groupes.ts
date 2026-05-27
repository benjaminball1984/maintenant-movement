/**
 * Helpers de listage des appartenances d'une personne (cycle V2 V2.3.22).
 *
 * 4 axes couverts par les tables V1 existantes :
 * - Communes libres (table `appartenance_commune` avec `personne_id`).
 * - Fédérations (table `appartenance_federation` indirecte via la commune
 *   → la personne appartient à une fédération **via** sa commune).
 * - Confédérations (idem, indirect via la fédération de la commune).
 * - GT thématiques (table `appartenance_gt` directe avec `personne_id`).
 *
 * Pas encore couvert (faute de table) : campagnes, groupes d'entraide
 * locaux. À ajouter quand les tables `appartenance_campagne` et
 * `appartenance_groupe_entraide` seront posées (mentionné dans V2.3.6).
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface AppartenanceGroupe {
  /** Identifiant de l'espace (commune/federation/confederation/gt). */
  id: string;
  /** Nom affichable. */
  nom: string;
  /** Slug pour la route. */
  slug: string;
  /** URL relative vers la page de l'espace. */
  href: string;
  /** Date d'entrée dans l'espace (rejointe_le). */
  depuisLe: string;
  /** Étiquette du type d'espace pour l'UI. */
  typeLibelle: string;
}

export interface MesAppartenances {
  communes: AppartenanceGroupe[];
  federations: AppartenanceGroupe[];
  confederations: AppartenanceGroupe[];
  gtThematiques: AppartenanceGroupe[];
}

/**
 * Charge toutes les appartenances actives d'une personne. Triées par
 * date d'entrée ascendante (les plus anciennes d'abord). 4 requêtes en
 * parallèle (1 par axe). Les jointures fédération/confédération
 * réutilisent les `commune_id` chargées.
 */
export async function listerMesAppartenances(personneId: string): Promise<MesAppartenances> {
  const supabase = await getSupabaseServer();

  const [appCommunes, appGt] = await Promise.all([
    supabase
      .from('appartenance_commune')
      .select('commune_id, rejointe_le, commune:commune (id, nom, slug)')
      .eq('personne_id', personneId)
      .eq('est_active', true)
      .order('rejointe_le', { ascending: true }),
    supabase
      .from('appartenance_gt')
      .select('gt_thematique_id, rejointe_le, gt_thematique:gt_thematique (id, nom, slug)')
      .eq('personne_id', personneId)
      .eq('est_active', true)
      .order('rejointe_le', { ascending: true }),
  ]);

  const communes: AppartenanceGroupe[] = (appCommunes.data ?? [])
    .filter(
      (l): l is typeof l & { commune: { id: string; nom: string; slug: string } } =>
        l.commune !== null && typeof l.commune === 'object',
    )
    .map((l) => ({
      id: l.commune.id,
      nom: l.commune.nom,
      slug: l.commune.slug,
      href: `/agir/communes/${l.commune.slug}`,
      depuisLe: l.rejointe_le,
      typeLibelle: 'Commune libre',
    }));

  const gtThematiques: AppartenanceGroupe[] = (appGt.data ?? [])
    .filter(
      (l): l is typeof l & { gt_thematique: { id: string; nom: string; slug: string } } =>
        l.gt_thematique !== null && typeof l.gt_thematique === 'object',
    )
    .map((l) => ({
      id: l.gt_thematique.id,
      nom: l.gt_thematique.nom,
      slug: l.gt_thematique.slug,
      // GT thématiques : aucune page publique livrée à ce jour (V2.3.22).
      // On laisse `href` vide → la page ne rend pas de lien cliquable.
      href: '',
      depuisLe: l.rejointe_le,
      typeLibelle: 'GT thématique',
    }));

  // Fédérations et confédérations : indirectes via les communes
  // d'appartenance. On charge `appartenance_federation` par `commune_id`,
  // puis `appartenance_confederation` par `federation_id` (l'id de
  // l'appartenance fédération sert de pivot).
  const communeIds = communes.map((c) => c.id);
  let federations: AppartenanceGroupe[] = [];
  let confederations: AppartenanceGroupe[] = [];

  if (communeIds.length > 0) {
    const { data: appFeds } = await supabase
      .from('appartenance_federation')
      .select('id, federation_id, rejointe_le, federation:federation (id, nom, slug)')
      .in('commune_id', communeIds)
      .eq('est_active', true)
      .order('rejointe_le', { ascending: true });

    federations = (appFeds ?? [])
      .filter(
        (l): l is typeof l & { federation: { id: string; nom: string; slug: string } } =>
          l.federation !== null && typeof l.federation === 'object',
      )
      .map((l) => ({
        id: l.federation.id,
        nom: l.federation.nom,
        slug: l.federation.slug,
        href: `/agir/federations/${l.federation.slug}`,
        depuisLe: l.rejointe_le,
        typeLibelle: 'Fédération',
      }));

    // Déduplique : une personne peut être dans plusieurs communes d'une
    // même fédération.
    federations = dedupParId(federations);

    const appFedIds = (appFeds ?? []).map((a) => a.id);
    if (appFedIds.length > 0) {
      const { data: appConfs } = await supabase
        .from('appartenance_confederation')
        .select('confederation_id, rejointe_le, confederation:confederation (id, nom, slug)')
        .in('federation_id', appFedIds)
        .eq('est_active', true)
        .order('rejointe_le', { ascending: true });

      confederations = (appConfs ?? [])
        .filter(
          (
            l,
          ): l is typeof l & {
            confederation: { id: string; nom: string; slug: string };
          } => l.confederation !== null && typeof l.confederation === 'object',
        )
        .map((l) => ({
          id: l.confederation.id,
          nom: l.confederation.nom,
          slug: l.confederation.slug,
          href: '/agir/confederations',
          depuisLe: l.rejointe_le,
          typeLibelle: 'Confédération',
        }));
      confederations = dedupParId(confederations);
    }
  }

  return { communes, federations, confederations, gtThematiques };
}

function dedupParId(liste: AppartenanceGroupe[]): AppartenanceGroupe[] {
  const vus = new Set<string>();
  const r: AppartenanceGroupe[] = [];
  for (const e of liste) {
    if (vus.has(e.id)) continue;
    vus.add(e.id);
    r.push(e);
  }
  return r;
}
