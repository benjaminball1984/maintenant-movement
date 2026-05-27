import { composerDocumentCsv } from '@/lib/export-csv';
import { getSupabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * Export CSV des sondages (V2.4.66). Admin uniquement. Limite 1000.
 *
 * Colonnes : id, slug, titre, question, mode, statut, ferme_le,
 * nb_options (count du JSONB options), createurice_id, created_at.
 */
const LIMITE = 1000;

export async function GET() {
  const supabase = await getSupabaseServer();
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) return new NextResponse('Forbidden', { status: 403 });

  const { data, error } = await supabase
    .from('sondage')
    .select(
      'id, slug, titre, question, mode, statut, ferme_le, options, createurice_id, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(LIMITE);

  if (error !== null) return new NextResponse(`Erreur: ${error.message}`, { status: 500 });

  const enTetes = [
    'id',
    'slug',
    'titre',
    'question',
    'mode',
    'statut',
    'ferme_le',
    'nb_options',
    'createurice_id',
    'created_at',
  ];

  const lignes = (data ?? []).map((s) => [
    s.id,
    s.slug,
    s.titre,
    s.question,
    s.mode,
    s.statut,
    s.ferme_le ?? '',
    Array.isArray(s.options) ? s.options.length : 0,
    s.createurice_id,
    s.created_at,
  ]);

  const corps = `﻿${composerDocumentCsv(enTetes, lignes)}`;
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(corps, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sondages-${date}.csv"`,
    },
  });
}
