import { composerDocumentCsv } from '@/lib/export-csv';
import { getSupabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * Export CSV des pétitions (V2.4.38). Admin uniquement.
 *
 * Colonnes : id, slug, titre, destinataire, statut, objectif,
 * nombre_signatures (compteur agrégé), createurice_prenom,
 * createurice_nom, created_at. Limite 1000.
 */
const LIMITE = 1000;

export async function GET() {
  const supabase = await getSupabaseServer();
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // On lit la vue `petition_compteur` qui agrège nombre_signatures
  // (V1 chantier 3.1). Jointure depuis petition.
  const { data, error } = await supabase
    .from('petition')
    .select(
      'id, slug, titre, destinataire, statut, objectif, created_at, compteur:petition_compteur(nombre_signatures)',
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
    'destinataire',
    'statut',
    'objectif',
    'nombre_signatures',
    'created_at',
  ];

  const lignes = (data ?? []).map((p) => {
    // biome-ignore lint/suspicious/noExplicitAny: jointure non typée précisément ici
    const compteur = (p as any).compteur as { nombre_signatures: number } | null;
    return [
      p.id,
      p.slug,
      p.titre,
      p.destinataire,
      p.statut,
      p.objectif,
      compteur?.nombre_signatures ?? 0,
      p.created_at,
    ];
  });

  const corps = `﻿${composerDocumentCsv(enTetes, lignes)}`;
  const aujourdhui = new Date().toISOString().slice(0, 10);

  return new NextResponse(corps, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="petitions-${aujourdhui}.csv"`,
    },
  });
}
