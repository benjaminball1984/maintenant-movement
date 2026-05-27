import { composerDocumentCsv } from '@/lib/export-csv';
import { getSupabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * Export CSV des mobilisations (V2.4.39). Admin uniquement.
 *
 * Colonnes : id, slug, titre, lieu, date_debut, date_fin, statut,
 * createurice_id, raison_retrait, created_at. Limite 1000.
 */
const LIMITE = 1000;

export async function GET() {
  const supabase = await getSupabaseServer();
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { data, error } = await supabase
    .from('mobilisation')
    .select(
      'id, slug, titre, lieu, date_debut, date_fin, statut, createurice_id, raison_retrait, created_at',
    )
    .order('date_debut', { ascending: false })
    .limit(LIMITE);

  if (error !== null) {
    return new NextResponse(`Erreur: ${error.message}`, { status: 500 });
  }

  const enTetes = [
    'id',
    'slug',
    'titre',
    'lieu',
    'date_debut',
    'date_fin',
    'statut',
    'createurice_id',
    'raison_retrait',
    'created_at',
  ];

  const lignes = (data ?? []).map((m) => [
    m.id,
    m.slug,
    m.titre,
    m.lieu,
    m.date_debut,
    m.date_fin ?? '',
    m.statut,
    m.createurice_id,
    m.raison_retrait ?? '',
    m.created_at,
  ]);

  const corps = `﻿${composerDocumentCsv(enTetes, lignes)}`;
  const aujourdhui = new Date().toISOString().slice(0, 10);

  return new NextResponse(corps, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="mobilisations-${aujourdhui}.csv"`,
    },
  });
}
