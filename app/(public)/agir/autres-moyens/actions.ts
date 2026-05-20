'use server';

import { getSession } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import {
  type DonneesAjouterOrganisationPartenaire,
  type DonneesRetirerOrganisation,
  ajouterOrganisationPartenaireSchema,
  retirerOrganisationSchema,
} from '@/lib/validations/autres-moyens';
import { slugifierTitreMobilisation } from '@/lib/validations/mobilisation';
import { revalidatePath } from 'next/cache';

/**
 * Server Actions du sous-espace « D'autres moyens d'agir » (chantier 5.4).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §7D` : distance protectrice,
 * présomption d'utilité, retrait si problématique. L'ajout est
 * réservé admin / modérateurice (la RLS enforce).
 */

export type ResultatAction<TPayload = unknown> =
  | ({ ok: true } & TPayload)
  | { ok: false; message: string };

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

export async function ajouterOrganisationPartenaire(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ slug: string }>> {
  const parse = ajouterOrganisationPartenaireSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesAjouterOrganisationPartenaire = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }

  const supabase = await getSupabaseServer();
  // La RLS d'insertion enforce admin ou modé, mais on retourne un
  // message clair si ce n'est pas le cas.
  const aDroits = await aDroitGestionAutresMoyens(supabase);
  if (!aDroits) {
    return {
      ok: false,
      message: 'Seul·e un·e admin ou modérateurice peut ajouter une organisation partenaire.',
    };
  }

  const slug = await genererSlugUnique(donnees.nom, supabase);
  const categorie =
    donnees.categorie_slug === '' || donnees.categorie_slug === undefined
      ? null
      : donnees.categorie_slug;
  const description =
    donnees.description_courte === '' || donnees.description_courte === undefined
      ? null
      : donnees.description_courte;

  const { error } = await supabase.from('organisation_partenaire').insert({
    nom: donnees.nom,
    slug,
    description_courte: description,
    url: donnees.url,
    categorie_slug: categorie,
    ajoute_par: session.userId,
  });
  if (error !== null) {
    return { ok: false, message: `Ajout impossible : ${error.message}` };
  }

  revalidatePath('/agir/autres-moyens');
  return { ok: true, slug };
}

export async function retirerOrganisation(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = retirerOrganisationSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesRetirerOrganisation = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const supabase = await getSupabaseServer();
  const aDroits = await aDroitGestionAutresMoyens(supabase);
  if (!aDroits) {
    return { ok: false, message: 'Droit de modération requis.' };
  }

  const { error } = await supabase
    .from('organisation_partenaire')
    .update({
      statut: 'retiree',
      raison_retrait: donnees.raison_retrait,
      retire_par: session.userId,
      retire_le: new Date().toISOString(),
    })
    .eq('id', donnees.organisation_id);
  if (error !== null) {
    return { ok: false, message: `Retrait impossible : ${error.message}` };
  }

  revalidatePath('/agir/autres-moyens');
  return { ok: true };
}

async function aDroitGestionAutresMoyens(supabase: ClientSupabase): Promise<boolean> {
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin === true) return true;
  const { data: estMod } = await supabase.rpc('est_moderateurice', {
    onglet_demande: 'autres_moyens',
  });
  return estMod === true;
}

async function genererSlugUnique(nom: string, supabase: ClientSupabase): Promise<string> {
  const base = slugifierTitreMobilisation(nom);
  if (base === '') return `orga-${Date.now()}`;
  let candidat = base;
  for (let i = 2; i <= 1000; i += 1) {
    const { count } = await supabase
      .from('organisation_partenaire')
      .select('id', { count: 'exact', head: true })
      .eq('slug', candidat);
    if ((count ?? 0) === 0) return candidat;
    candidat = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}
