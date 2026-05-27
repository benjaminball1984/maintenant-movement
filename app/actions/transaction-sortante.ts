'use server';

import { getSession } from '@/lib/auth/session';
import { initierTransactionSortante } from '@/lib/caisse';
import { MIME_JUSTIFICATIF_AUTORISES, type MimeJustificatif } from '@/lib/storage/justificatifs';
import { getSupabaseServer } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Server Action d'initiation d'une transaction sortante (cycle V2 V2.3.33).
 *
 * D12bis : justificatif obligatoire. La FormData reçue est validée
 * strictement avant d'appeler `initierTransactionSortante` (V2.2.3).
 *
 * Vérifie le droit admin national. À élargir aux trésorier·ière·s
 * cooptés quand `verifierDroit('gerer_caisse')` V2.1.3 sera branché.
 *
 * Le statut initial est `initiee`. Une confirmation séparée
 * (V2.3.34 ultérieure) le passera à `confirmee` après vérification
 * comptable.
 */

const schema = z.object({
  caisse_id: z.string().uuid(),
  receptacle_id: z.string().uuid(),
  beneficiaire_personne_id: z.string().uuid().nullable(),
  beneficiaire_externe_nom: z.string().max(200).nullable(),
  beneficiaire_externe_iban_ou_wallet: z.string().max(500).nullable(),
  montant: z.number().positive().max(1_000_000),
  canal: z.enum(['euro', '99_coin']),
  motif: z.string().min(5).max(1000),
  justificatif_chemin: z.string().min(1),
  justificatif_nom_original: z.string().min(1).max(500),
  justificatif_mime_type: z.enum(MIME_JUSTIFICATIF_AUTORISES),
});

export type ResultatInitiation =
  | { ok: true; transactionId: string }
  | { ok: false; message: string };

export async function initierTransactionSortanteAction(
  donneesBrutes: unknown,
): Promise<ResultatInitiation> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise.' };
  }

  const supabase = await getSupabaseServer();
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) {
    return { ok: false, message: 'Action réservée aux admins nationaux.' };
  }

  const parse = schema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const d = parse.data;

  // Au moins un bénéficiaire (interne ou externe).
  if (
    d.beneficiaire_personne_id === null &&
    (d.beneficiaire_externe_nom === null || d.beneficiaire_externe_nom.trim().length === 0)
  ) {
    return {
      ok: false,
      message: 'Un bénéficiaire (interne ou externe) est obligatoire.',
    };
  }

  const r = await initierTransactionSortante({
    caisseId: d.caisse_id,
    receptacleId: d.receptacle_id,
    beneficiairePersonneId: d.beneficiaire_personne_id,
    beneficiaireExterneNom: d.beneficiaire_externe_nom,
    beneficiaireExterneIbanOuWallet: d.beneficiaire_externe_iban_ou_wallet,
    montant: d.montant,
    canal: d.canal,
    motif: d.motif,
    justificatifStoragePath: d.justificatif_chemin,
    justificatifNomOriginal: d.justificatif_nom_original,
    justificatifMimeType: d.justificatif_mime_type as MimeJustificatif,
    initieParPersonneId: session.userId,
  });

  if (!r.ok) return { ok: false, message: r.message };

  revalidatePath(`/admin/national/tresorerie/${d.caisse_id}`);
  revalidatePath('/admin/national/tresorerie');
  return { ok: true, transactionId: r.transactionId };
}

/**
 * Confirme une transaction sortante (V2.3.36). Transition `initiee → confirmee`.
 * Vérifie l'admin national. Le `confirme_par_personne_id` est celui qui
 * appelle l'action ; il DEVRAIT idéalement être différent de
 * `initie_par_personne_id` pour respecter une double-signature, mais
 * cette règle est portée par l'usage humain (pas de contrainte SQL).
 */
export async function confirmerTransactionSortanteAction(options: {
  transactionId: string;
  caisseId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise.' };
  }

  const supabase = await getSupabaseServer();
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) {
    return { ok: false, message: 'Action réservée aux admins nationaux.' };
  }

  const { error } = await supabase
    .from('transaction_sortante')
    .update({
      statut: 'confirmee',
      confirme_par_personne_id: session.userId,
      confirme_le: new Date().toISOString(),
    })
    .eq('id', options.transactionId)
    .eq('statut', 'initiee');

  if (error !== null) return { ok: false, message: error.message };

  revalidatePath(`/admin/national/tresorerie/${options.caisseId}`);
  revalidatePath('/admin/national/tresorerie');
  return { ok: true };
}

/**
 * Annule une transaction sortante initiée (V2.3.36).
 * Transition `initiee → annulee`. Permet de retirer une transaction
 * posée par erreur avant confirmation comptable.
 */
export async function annulerTransactionSortanteAction(options: {
  transactionId: string;
  caisseId: string;
  motif: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise.' };
  }

  const motifNettoye = options.motif.trim();
  if (motifNettoye.length < 5) {
    return { ok: false, message: 'Un motif d’annulation d’au moins 5 caractères est requis.' };
  }

  const supabase = await getSupabaseServer();
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) {
    return { ok: false, message: 'Action réservée aux admins nationaux.' };
  }

  // On garde le motif original ET on ajoute l'annulation au motif existant.
  const { data: tx } = await supabase
    .from('transaction_sortante')
    .select('motif')
    .eq('id', options.transactionId)
    .maybeSingle();
  const motifFinal = tx !== null ? `${tx.motif}\n\n[Annulée] ${motifNettoye}` : motifNettoye;

  const { error } = await supabase
    .from('transaction_sortante')
    .update({
      statut: 'annulee',
      motif: motifFinal,
    })
    .eq('id', options.transactionId)
    .eq('statut', 'initiee');

  if (error !== null) return { ok: false, message: error.message };

  revalidatePath(`/admin/national/tresorerie/${options.caisseId}`);
  revalidatePath('/admin/national/tresorerie');
  return { ok: true };
}
