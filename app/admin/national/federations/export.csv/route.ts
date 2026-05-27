import { composerDocumentCsv } from '@/lib/export-csv';
import { getSupabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * Export CSV des fédérations (V2.4.37). Admin uniquement.
 *
 * Colonnes : id, slug, nom, type, description_courte, nb_communes,
 * created_at. Nb communes via une requête de count groupé séparée.
 */
const LIMITE = 1000;

export async function GET() {
  const supabase = await getSupabaseServer();
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { data: federations, error } = await supabase
    .from('federation')
    .select('id, slug, nom, type, description_courte, created_at')
    .order('nom', { ascending: true })
    .limit(LIMITE);

  if (error !== null) {
    return new NextResponse(`Erreur: ${error.message}`, { status: 500 });
  }

  const ids = (federations ?? []).map((f) => f.id);
  const { data: appartenances } = await supabase
    .from('appartenance_federation')
    .select('federation_id')
    .in('federation_id', ids);

  const nbParFederation = new Map<string, number>();
  for (const a of appartenances ?? []) {
    nbParFederation.set(a.federation_id, (nbParFederation.get(a.federation_id) ?? 0) + 1);
  }

  const enTetes = ['id', 'slug', 'nom', 'type', 'description_courte', 'nb_communes', 'created_at'];

  const lignes = (federations ?? []).map((f) => [
    f.id,
    f.slug,
    f.nom,
    f.type,
    f.description_courte ?? '',
    nbParFederation.get(f.id) ?? 0,
    f.created_at,
  ]);

  const corps = `﻿${composerDocumentCsv(enTetes, lignes)}`;
  const aujourdhui = new Date().toISOString().slice(0, 10);

  return new NextResponse(corps, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="federations-${aujourdhui}.csv"`,
    },
  });
}
