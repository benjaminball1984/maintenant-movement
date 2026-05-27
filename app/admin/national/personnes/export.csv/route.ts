import { composerDocumentCsv } from '@/lib/export-csv';
import { getSupabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * Endpoint d'export CSV des personnes (V2.4.36).
 *
 * GET `/admin/national/personnes/export.csv` — réservé aux admins
 * généraux (RLS rejette toute lecture non autorisée). Retourne un
 * fichier CSV strict (RFC 4180) avec les colonnes :
 * `id, email, prenom, nom, statut, email_verifie, derniere_connexion_le, created_at`.
 *
 * Limite 5000 lignes par défaut pour ne pas tenir tout le référentiel
 * en mémoire d'un coup. Aux admins de paginer si plus.
 */
const LIMITE_DEFAUT = 5000;

export async function GET() {
  const supabase = await getSupabaseServer();
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { data, error } = await supabase
    .from('personne')
    .select('id, email, prenom, nom, statut, email_verifie, derniere_connexion_le, created_at')
    .order('created_at', { ascending: false })
    .limit(LIMITE_DEFAUT);

  if (error !== null) {
    return new NextResponse(`Erreur: ${error.message}`, { status: 500 });
  }

  const enTetes = [
    'id',
    'email',
    'prenom',
    'nom',
    'statut',
    'email_verifie',
    'derniere_connexion_le',
    'created_at',
  ];

  const lignes = (data ?? []).map((p) => [
    p.id,
    p.email ?? '',
    p.prenom ?? '',
    p.nom ?? '',
    p.statut,
    p.email_verifie,
    p.derniere_connexion_le ?? '',
    p.created_at,
  ]);

  // Préfixe BOM UTF-8 pour qu'Excel ouvre l'export en UTF-8 sans
  // demander de configuration (utf-8 sinon mal détecté).
  const corps = `﻿${composerDocumentCsv(enTetes, lignes)}`;
  const aujourdhui = new Date().toISOString().slice(0, 10);

  return new NextResponse(corps, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="personnes-${aujourdhui}.csv"`,
    },
  });
}
