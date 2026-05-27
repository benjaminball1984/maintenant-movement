import { composerDocumentCsv } from '@/lib/export-csv';
import { getSupabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * Export CSV des médias (V2.4.66). Admin uniquement. Limite 5000.
 */
const LIMITE = 5000;

export async function GET() {
  const supabase = await getSupabaseServer();
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) return new NextResponse('Forbidden', { status: 403 });

  const { data, error } = await supabase
    .from('media')
    .select(
      'id, slug, titre, type, statut, publie_le, auteurice_id, provenance_externe, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(LIMITE);

  if (error !== null) return new NextResponse(`Erreur: ${error.message}`, { status: 500 });

  const enTetes = [
    'id',
    'slug',
    'titre',
    'type',
    'statut',
    'publie_le',
    'auteurice_id',
    'provenance_externe',
    'created_at',
  ];

  const lignes = (data ?? []).map((m) => [
    m.id,
    m.slug,
    m.titre,
    m.type,
    m.statut,
    m.publie_le ?? '',
    m.auteurice_id ?? '',
    m.provenance_externe ?? '',
    m.created_at,
  ]);

  const corps = `﻿${composerDocumentCsv(enTetes, lignes)}`;
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(corps, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="medias-${date}.csv"`,
    },
  });
}
