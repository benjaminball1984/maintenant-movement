import { composerDocumentCsv } from '@/lib/export-csv';
import { getSupabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * Export CSV des signatures d'une pétition ou d'un appel (V2.6.134).
 * Réservé aux admins généraux.
 *
 * Pourquoi cette route existe : depuis qu'une assemblée, un collectif, un
 * syndicat ou une organisation peut co-signer un texte, l'équipe a besoin de
 * récupérer ces signatures avec le contact de la personne qui a signé pour
 * l'organisation. Le site n'affiche publiquement que le nom de l'organisation
 * — le reste ne sort que par ici, sous droit admin.
 *
 * Colonnes : type de signataire, organisation (nom, type, territoire, accord
 * d'affichage), fonction, identité et contact de la personne (prénom et nom,
 * ou pseudonyme si la personne a choisi de ne pas donner son identité civile),
 * cases cochées, date. Limite 5000 lignes (au-delà, il faudra paginer).
 */
const LIMITE = 5000;

interface ParamsExport {
  slug: string;
}

export async function GET(
  _requete: Request,
  { params }: { params: Promise<ParamsExport> },
): Promise<NextResponse> {
  const { slug } = await params;
  const supabase = await getSupabaseServer();

  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { data: petition, error: erreurPetition } = await supabase
    .from('petition')
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (erreurPetition !== null || petition === null) {
    return new NextResponse('Pétition introuvable', { status: 404 });
  }

  const { data, error } = await supabase
    .from('signature_petition')
    .select(
      'type_signataire, organisation_nom, organisation_categorie, organisation_territoire, organisation_affichage_public, signataire_fonction, prenom, nom, pseudonyme, email, code_postal, telephone, accepte_newsletter, accepte_contact_createurice, created_at',
    )
    .eq('petition_id', petition.id)
    .order('created_at', { ascending: true })
    .limit(LIMITE);

  if (error !== null) {
    return new NextResponse(`Erreur: ${error.message}`, { status: 500 });
  }

  const enTetes = [
    'type_signataire',
    'organisation_nom',
    'organisation_categorie',
    'organisation_territoire',
    'organisation_affichage_public',
    'signataire_fonction',
    'prenom',
    'nom',
    'pseudonyme',
    'email',
    'code_postal',
    'telephone',
    'accepte_newsletter',
    'accepte_contact_createurice',
    'created_at',
  ];

  const lignes = (data ?? []).map((signature) => [
    signature.type_signataire,
    signature.organisation_nom ?? '',
    signature.organisation_categorie ?? '',
    signature.organisation_territoire ?? '',
    signature.organisation_affichage_public ? 'oui' : 'non',
    signature.signataire_fonction ?? '',
    signature.prenom,
    signature.nom,
    signature.pseudonyme ?? '',
    signature.email,
    signature.code_postal,
    signature.telephone ?? '',
    signature.accepte_newsletter ? 'oui' : 'non',
    signature.accepte_contact_createurice ? 'oui' : 'non',
    signature.created_at,
  ]);

  // BOM UTF-8 en tête : sans lui, Excel en français casse les accents.
  const corps = `﻿${composerDocumentCsv(enTetes, lignes)}`;
  const aujourdhui = new Date().toISOString().slice(0, 10);

  return new NextResponse(corps, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="signatures-${petition.slug}-${aujourdhui}.csv"`,
    },
  });
}
