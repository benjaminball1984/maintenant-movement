import { composerDocumentCsv } from '@/lib/export-csv';
import { getSupabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * Export CSV des communes (V2.4.37). Admin uniquement.
 *
 * Colonnes : id, slug, nom, code_insee, code_postal_principal,
 * departement, region, statut_creation, created_at. Limite 50 000
 * lignes (le référentiel fait ~35 011 communes pré-créées).
 */
const LIMITE = 50000;

export async function GET() {
  const supabase = await getSupabaseServer();
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { data, error } = await supabase
    .from('commune')
    .select(
      'id, slug, nom, code_insee, code_postal_principal, departement, region, statut_creation, created_at',
    )
    .order('nom', { ascending: true })
    .limit(LIMITE);

  if (error !== null) {
    return new NextResponse(`Erreur: ${error.message}`, { status: 500 });
  }

  const enTetes = [
    'id',
    'slug',
    'nom',
    'code_insee',
    'code_postal_principal',
    'departement',
    'region',
    'statut_creation',
    'created_at',
  ];

  const lignes = (data ?? []).map((c) => [
    c.id,
    c.slug,
    c.nom,
    c.code_insee ?? '',
    c.code_postal_principal ?? '',
    c.departement ?? '',
    c.region ?? '',
    c.statut_creation,
    c.created_at,
  ]);

  const corps = `﻿${composerDocumentCsv(enTetes, lignes)}`;
  const aujourdhui = new Date().toISOString().slice(0, 10);

  return new NextResponse(corps, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="communes-${aujourdhui}.csv"`,
    },
  });
}
