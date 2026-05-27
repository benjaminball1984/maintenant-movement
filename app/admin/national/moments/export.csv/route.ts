import { composerDocumentCsv } from '@/lib/export-csv';
import { getSupabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * Export CSV des moments solidaires (V2.4.66). Admin uniquement.
 * 11 colonnes, limite 5000, BOM UTF-8 pour Excel.
 */
const LIMITE = 5000;

export async function GET() {
  const supabase = await getSupabaseServer();
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) return new NextResponse('Forbidden', { status: 403 });

  const { data, error } = await supabase
    .from('moment_solidaire')
    .select(
      'id, slug, titre, type, sous_type, lieu, commence_le, termine_le, statut, createurice_id, created_at',
    )
    .order('commence_le', { ascending: false })
    .limit(LIMITE);

  if (error !== null) return new NextResponse(`Erreur: ${error.message}`, { status: 500 });

  const enTetes = [
    'id',
    'slug',
    'titre',
    'type',
    'sous_type',
    'lieu',
    'commence_le',
    'termine_le',
    'statut',
    'createurice_id',
    'created_at',
  ];

  const lignes = (data ?? []).map((m) => [
    m.id,
    m.slug,
    m.titre,
    m.type,
    m.sous_type ?? '',
    m.lieu,
    m.commence_le,
    m.termine_le ?? '',
    m.statut,
    m.createurice_id,
    m.created_at,
  ]);

  const corps = `﻿${composerDocumentCsv(enTetes, lignes)}`;
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(corps, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="moments-${date}.csv"`,
    },
  });
}
