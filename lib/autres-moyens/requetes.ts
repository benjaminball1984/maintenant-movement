import { getSupabaseServer } from '@/lib/supabase';
import type { OrganisationPartenaire } from '@/types/database';

/**
 * Couche de requêtes du sous-espace « D'autres moyens d'agir »
 * (chantier 5.4). Retourne uniquement les organisations affichées,
 * groupées par catégorie pour la page.
 */

export async function listerOrganisationsPartenaires(): Promise<OrganisationPartenaire[]> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('organisation_partenaire')
    .select('*')
    .eq('statut', 'affichee')
    .order('nom');
  return data ?? [];
}

/**
 * Renvoie un Map<categorie_slug, OrganisationPartenaire[]> pour
 * faciliter le rendu groupé. La catégorie `null` devient `'autres'`
 * dans la Map.
 */
export async function listerOrganisationsParCategorie(): Promise<
  Map<string, OrganisationPartenaire[]>
> {
  const orgas = await listerOrganisationsPartenaires();
  const groupes = new Map<string, OrganisationPartenaire[]>();
  for (const o of orgas) {
    const cat = o.categorie_slug ?? 'autres';
    const liste = groupes.get(cat) ?? [];
    liste.push(o);
    groupes.set(cat, liste);
  }
  return groupes;
}
