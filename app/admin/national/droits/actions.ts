'use server';

import type { BeneficiaireDroit } from '@/lib/admin/national/droits';
import { estAdminNational } from '@/lib/admin/national/garde';
import { journaliser } from '@/lib/admin/national/journal';
import { getSession } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import {
  type DonneesAccorderDroit,
  accorderDroitSchema,
  retirerDroitSchema,
} from '@/lib/validations/droit-admin';
import { revalidatePath } from 'next/cache';

/**
 * Server Actions de gestion des droits d'administration (console nationale).
 *
 * Toutes suivent le pattern maison `ResultatAction` et appliquent une
 * défense en profondeur :
 *   1. validation Zod (messages clairs en français) ;
 *   2. vérification `est_admin_national()` côté serveur ;
 *   3. mutation via le client serveur (la RLS `droit_admin_write_national`
 *      reste la dernière ligne de défense) ;
 *   4. journalisation systématique dans `journal_admin`.
 */
export type ResultatAction<TPayload = unknown> =
  | ({ ok: true } & TPayload)
  | { ok: false; message: string };

// ============================================================
// Accorder un droit
// ============================================================
export async function accorderDroit(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ droitId: string }>> {
  const parse = accorderDroitSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesAccorderDroit = parse.data;

  if (!(await estAdminNational())) {
    return { ok: false, message: 'Réservé à l’administration nationale.' };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }

  const supabase = await getSupabaseServer();

  // On ne renseigne `perimetre_onglet` que pour la modération (vide = tous
  // les onglets → null) et `scope_commune_id` que pour l'animation, pour
  // respecter les CHECK de la migration 008.
  const perimetre =
    donnees.niveau === 'moderation' &&
    donnees.perimetre_onglet !== undefined &&
    donnees.perimetre_onglet.length > 0
      ? donnees.perimetre_onglet
      : null;
  const scopeCommune = donnees.niveau === 'animation' ? (donnees.scope_commune_id ?? null) : null;

  const { data, error } = await supabase
    .from('droit_admin')
    .insert({
      personne_id: donnees.personne_id,
      niveau: donnees.niveau,
      perimetre_onglet: perimetre,
      scope_commune_id: scopeCommune,
      accorde_par: session.userId,
    })
    .select('id')
    .single();

  if (error !== null || data === null) {
    return {
      ok: false,
      message: `Attribution impossible : ${error?.message ?? 'erreur inconnue'}`,
    };
  }

  await journaliser({
    action: 'droit.accorde',
    cibleTable: 'droit_admin',
    cibleId: data.id,
    nouvelEtat: {
      personne_id: donnees.personne_id,
      niveau: donnees.niveau,
      perimetre_onglet: perimetre,
      scope_commune_id: scopeCommune,
    },
  });

  revalidatePath('/admin/national/droits');
  return { ok: true, droitId: data.id };
}

// ============================================================
// Retirer un droit
// ============================================================
export async function retirerDroit(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = retirerDroitSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const { droit_id } = parse.data;

  if (!(await estAdminNational())) {
    return { ok: false, message: 'Réservé à l’administration nationale.' };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }

  const supabase = await getSupabaseServer();

  // État avant retrait, pour la traçabilité du journal d'audit.
  const { data: avant } = await supabase
    .from('droit_admin')
    .select('id, personne_id, niveau, perimetre_onglet, scope_commune_id, retire_le')
    .eq('id', droit_id)
    .maybeSingle();

  if (avant === null) {
    return { ok: false, message: 'Droit introuvable.' };
  }
  if (avant.retire_le !== null) {
    return { ok: false, message: 'Ce droit est déjà retiré.' };
  }

  const { error } = await supabase
    .from('droit_admin')
    .update({ retire_le: new Date().toISOString(), retire_par: session.userId })
    .eq('id', droit_id)
    .is('retire_le', null);

  if (error !== null) {
    return { ok: false, message: `Retrait impossible : ${error.message}` };
  }

  await journaliser({
    action: 'droit.retire',
    cibleTable: 'droit_admin',
    cibleId: droit_id,
    ancienEtat: {
      personne_id: avant.personne_id,
      niveau: avant.niveau,
      perimetre_onglet: avant.perimetre_onglet,
      scope_commune_id: avant.scope_commune_id,
    },
  });

  revalidatePath('/admin/national/droits');
  return { ok: true };
}

// ============================================================
// Recherches (alimentent les sélecteurs du formulaire d'attribution)
// ============================================================

/** Échappe les caractères qui casseraient un filtre `or` PostgREST. */
function termeSecurise(saisie: string): string {
  return saisie.replace(/[%,()]/g, ' ').trim();
}

/**
 * Recherche de personnes par email, nom ou prénom (pour choisir à qui
 * accorder un droit). Réservé à l'admin nationale.
 */
export async function chercherPersonnes(saisie: string): Promise<BeneficiaireDroit[]> {
  if (!(await estAdminNational())) return [];

  const terme = termeSecurise(saisie);
  if (terme.length < 2) return [];

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('personne')
    .select('id, prenom, nom, email')
    .or(`email.ilike.%${terme}%,nom.ilike.%${terme}%,prenom.ilike.%${terme}%`)
    .eq('statut', 'actif')
    .limit(8);

  if (error !== null || data === null) return [];
  return data;
}

/** Une commune proposée à la sélection (droit d'animation). */
export interface CommuneRecherche {
  id: string;
  nom: string;
  code_postal_principal: string | null;
  departement: string | null;
}

/**
 * Recherche de communes par nom ou code postal (pour cibler un droit
 * d'animation). Réservé à l'admin nationale.
 */
export async function chercherCommunes(saisie: string): Promise<CommuneRecherche[]> {
  if (!(await estAdminNational())) return [];

  const terme = termeSecurise(saisie);
  if (terme.length < 2) return [];

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('commune')
    .select('id, nom, code_postal_principal, departement')
    .or(`nom.ilike.%${terme}%,code_postal_principal.ilike.%${terme}%`)
    .order('nom', { ascending: true })
    .limit(8);

  if (error !== null || data === null) return [];
  return data;
}
