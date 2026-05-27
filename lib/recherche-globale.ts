import { getSupabaseServer } from '@/lib/supabase';

export type TypeResultatRecherche =
  | 'petition'
  | 'mobilisation'
  | 'cagnotte'
  | 'commune'
  | 'federation'
  | 'media'
  | 'sondage'
  | 'salle_decider'
  | 'journal_affiche'
  | 'groupe_entraide_local'
  | 'campagne';

export interface ResultatRecherche {
  type: TypeResultatRecherche;
  titre: string;
  sousTitre: string | null;
  href: string;
  imageUrl: string | null;
}

const LIBELLE_TYPE: Record<TypeResultatRecherche, string> = {
  petition: 'Pétition',
  mobilisation: 'Mobilisation',
  cagnotte: 'Cagnotte',
  commune: 'Commune',
  federation: 'Fédération',
  media: 'Article / média',
  sondage: 'Sondage',
  salle_decider: 'Salle Décider',
  journal_affiche: 'Journal-affiche',
  groupe_entraide_local: 'Groupe d’entraide',
  campagne: 'Campagne',
};

export function libelleType(t: TypeResultatRecherche): string {
  return LIBELLE_TYPE[t];
}

/**
 * Recherche globale (V2.4.24) — recherche `ilike` sur le titre / nom
 * de toutes les entités publiques principales du site, en parallèle.
 * Limite 10 résultats par type. RLS Supabase filtre les éléments non
 * accessibles. Tri par pertinence simple : préfixe match avant infixe.
 */
export async function rechercherGlobalement(query: string): Promise<ResultatRecherche[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const motif = `%${q}%`;
  const supabase = await getSupabaseServer();

  const [
    petitionsR,
    mobilisationsR,
    cagnottesR,
    communesR,
    federationsR,
    mediasR,
    sondagesR,
    sallesR,
    editionsR,
    groupesR,
    campagnesR,
  ] = await Promise.all([
    supabase
      .from('petition')
      .select('titre, slug, image_url')
      .ilike('titre', motif)
      .eq('statut', 'publiee')
      .limit(10),
    supabase
      .from('mobilisation')
      .select('titre, slug, image_url')
      .ilike('titre', motif)
      .eq('statut', 'publiee')
      .limit(10),
    supabase
      .from('cagnotte')
      .select('titre, slug, image_url')
      .ilike('titre', motif)
      .eq('statut', 'publiee')
      .limit(10),
    supabase.from('commune').select('nom, slug').ilike('nom', motif).limit(10),
    supabase.from('federation').select('nom, slug').ilike('nom', motif).limit(10),
    supabase
      .from('media')
      .select('titre, slug, vignette_url')
      .ilike('titre', motif)
      .eq('statut', 'publie')
      .limit(10),
    supabase
      .from('sondage')
      .select('titre, slug, question')
      .ilike('titre', motif)
      .eq('statut', 'ouvert')
      .limit(10),
    supabase.from('salle_decider').select('nom, slug, description').ilike('nom', motif).limit(10),
    supabase
      .from('journal_affiche')
      .select('titre, slug, sous_titre, image_couverture_url, numero')
      .ilike('titre', motif)
      .eq('statut', 'publie')
      .limit(10),
    supabase
      .from('groupe_entraide_local')
      .select('nom, slug, description_courte, image_url')
      .ilike('nom', motif)
      .eq('statut', 'publie')
      .limit(10),
    supabase
      .from('campagne')
      .select('titre, slug, texte, image_url')
      .ilike('titre', motif)
      .eq('statut', 'publiee')
      .limit(10),
  ]);

  const resultats: ResultatRecherche[] = [];

  for (const p of petitionsR.data ?? []) {
    resultats.push({
      type: 'petition',
      titre: p.titre,
      sousTitre: null,
      href: `/mobiliser/petitions/${p.slug}`,
      imageUrl: p.image_url,
    });
  }
  for (const m of mobilisationsR.data ?? []) {
    resultats.push({
      type: 'mobilisation',
      titre: m.titre,
      sousTitre: null,
      href: `/mobiliser/mobilisations/${m.slug}`,
      imageUrl: m.image_url,
    });
  }
  for (const c of cagnottesR.data ?? []) {
    resultats.push({
      type: 'cagnotte',
      titre: c.titre,
      sousTitre: null,
      href: `/mobiliser/cagnottes/${c.slug}`,
      imageUrl: c.image_url,
    });
  }
  for (const c of communesR.data ?? []) {
    resultats.push({
      type: 'commune',
      titre: c.nom,
      sousTitre: null,
      href: `/agir/communes/${c.slug}`,
      imageUrl: null,
    });
  }
  for (const f of federationsR.data ?? []) {
    resultats.push({
      type: 'federation',
      titre: f.nom,
      sousTitre: null,
      href: `/agir/federations/${f.slug}`,
      imageUrl: null,
    });
  }
  for (const m of mediasR.data ?? []) {
    resultats.push({
      type: 'media',
      titre: m.titre,
      sousTitre: null,
      href: `/s-informer/media/${m.slug}`,
      imageUrl: m.vignette_url,
    });
  }
  for (const s of sondagesR.data ?? []) {
    resultats.push({
      type: 'sondage',
      titre: s.titre,
      sousTitre: s.question,
      href: `/s-informer/sondages/${s.slug}`,
      imageUrl: null,
    });
  }
  for (const s of sallesR.data ?? []) {
    resultats.push({
      type: 'salle_decider',
      titre: s.nom,
      sousTitre: s.description,
      href: `/s-informer/decider/${s.slug}`,
      imageUrl: null,
    });
  }
  for (const e of editionsR.data ?? []) {
    resultats.push({
      type: 'journal_affiche',
      titre: `${e.titre} (n°${e.numero})`,
      sousTitre: e.sous_titre,
      href: `/s-informer/journal/${e.slug}`,
      imageUrl: e.image_couverture_url,
    });
  }
  for (const g of groupesR.data ?? []) {
    resultats.push({
      type: 'groupe_entraide_local',
      titre: g.nom,
      sousTitre: g.description_courte,
      href: `/s-entraider/groupes-locaux/${g.slug}`,
      imageUrl: g.image_url,
    });
  }
  for (const c of campagnesR.data ?? []) {
    resultats.push({
      type: 'campagne',
      titre: c.titre,
      sousTitre: c.texte.slice(0, 160),
      href: `/mobiliser/campagnes/${c.slug}`,
      imageUrl: c.image_url,
    });
  }

  // Tri pertinence simple : préfixe avant infixe, longueur de titre.
  const qLower = q.toLowerCase();
  resultats.sort((a, b) => {
    const aPrefixe = a.titre.toLowerCase().startsWith(qLower);
    const bPrefixe = b.titre.toLowerCase().startsWith(qLower);
    if (aPrefixe && !bPrefixe) return -1;
    if (!aPrefixe && bPrefixe) return 1;
    return a.titre.length - b.titre.length;
  });

  return resultats;
}
