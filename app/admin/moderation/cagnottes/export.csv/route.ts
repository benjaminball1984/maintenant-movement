import { composerDocumentCsv } from '@/lib/export-csv';
import { getSupabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * Export CSV des cagnottes (V2.4.39). Admin uniquement.
 *
 * Colonnes : id, slug, titre, type (ouverte/lutte/cotisation), statut,
 * stripe_account_id, wallet_t99cp, total_euros_centimes (vue agrégée),
 * total_t99cp, nombre_dons, created_at. Limite 1000.
 */
const LIMITE = 1000;

export async function GET() {
  const supabase = await getSupabaseServer();
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { data, error } = await supabase
    .from('cagnotte')
    .select(
      'id, slug, titre, type, statut, stripe_account_id, wallet_t99cp, created_at, compteur:cagnotte_compteur(total_euros_centimes, total_t99cp, nombre_dons)',
    )
    .order('created_at', { ascending: false })
    .limit(LIMITE);

  if (error !== null) {
    return new NextResponse(`Erreur: ${error.message}`, { status: 500 });
  }

  const enTetes = [
    'id',
    'slug',
    'titre',
    'type',
    'statut',
    'stripe_account_id',
    'wallet_t99cp',
    'total_euros_centimes',
    'total_t99cp',
    'nombre_dons',
    'created_at',
  ];

  const lignes = (data ?? []).map((c) => {
    // biome-ignore lint/suspicious/noExplicitAny: jointure non typée précisément
    const compteur = (c as any).compteur as {
      total_euros_centimes: number;
      total_t99cp: number;
      nombre_dons: number;
    } | null;
    return [
      c.id,
      c.slug,
      c.titre,
      c.type,
      c.statut,
      c.stripe_account_id ?? '',
      c.wallet_t99cp ?? '',
      compteur?.total_euros_centimes ?? 0,
      compteur?.total_t99cp ?? 0,
      compteur?.nombre_dons ?? 0,
      c.created_at,
    ];
  });

  const corps = `﻿${composerDocumentCsv(enTetes, lignes)}`;
  const aujourdhui = new Date().toISOString().slice(0, 10);

  return new NextResponse(corps, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="cagnottes-${aujourdhui}.csv"`,
    },
  });
}
