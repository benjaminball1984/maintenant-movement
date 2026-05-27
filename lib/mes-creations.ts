/**
 * Helpers pour la page « Mes créations » (V2.4.7).
 *
 * Liste tout ce qu'une personne a créé sur la plateforme :
 * - pétitions, mobilisations, campagnes, cagnottes
 * - offres entraide, services SEL, produits/boutiques/minimarchés marché
 * - moments solidaires, sondages
 * - posts réseau
 * - groupes d'entraide locaux
 * - GT thématiques, communes libres
 *
 * Server-side avec RLS. Tri par date de création décroissante.
 */

import { getSupabaseServer } from '@/lib/supabase';

export type TypeCreation =
  | 'petition'
  | 'mobilisation'
  | 'campagne'
  | 'cagnotte'
  | 'offre_entraide'
  | 'service_sel'
  | 'produit_marche'
  | 'boutique_marche'
  | 'minimarche'
  | 'moment_solidaire'
  | 'sondage'
  | 'post_reseau'
  | 'groupe_entraide_local'
  | 'commune_libre';

export interface Creation {
  id: string;
  type: TypeCreation;
  titre: string;
  href: string;
  statut: string | null;
  createdAt: string;
}

export interface MesCreations {
  total: number;
  parType: Record<TypeCreation, Creation[]>;
}

export async function chargerMesCreations(personneId: string): Promise<MesCreations> {
  const supabase = await getSupabaseServer();

  const [
    petitions,
    mobilisations,
    campagnes,
    cagnottes,
    offres,
    sels,
    produits,
    boutiques,
    minimarches,
    moments,
    sondages,
    posts,
    groupes,
    communes,
  ] = await Promise.all([
    supabase
      .from('petition')
      .select('id, titre, slug, statut, created_at')
      .eq('createurice_id', personneId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('mobilisation')
      .select('id, titre, slug, statut, created_at')
      .eq('createurice_id', personneId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('campagne')
      .select('id, titre, slug, statut, created_at')
      .eq('createurice_id', personneId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('cagnotte')
      .select('id, titre, slug, statut, created_at')
      .eq('createurice_id', personneId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('offre_entraide')
      .select('id, titre, slug, statut, created_at')
      .eq('createurice_id', personneId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('service_sel')
      .select('id, titre, slug, statut, created_at')
      .eq('createurice_id', personneId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('produit_marche')
      .select('id, titre, slug, statut, created_at')
      .eq('vendeureuse_id', personneId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('boutique_marche')
      .select('id, nom, slug, statut, created_at')
      .eq('createurice_id', personneId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('minimarche_solidaire')
      .select('id, titre, slug, statut, created_at')
      .eq('createurice_id', personneId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('moment_solidaire')
      .select('id, titre, slug, statut, created_at')
      .eq('createurice_id', personneId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('sondage')
      .select('id, titre, slug, statut, created_at')
      .eq('createurice_id', personneId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('post_reseau')
      .select('id, texte, statut, created_at')
      .eq('auteurice_id', personneId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('groupe_entraide_local')
      .select('id, nom, slug, statut, created_at')
      .eq('createurice_id', personneId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('commune')
      .select('id, nom, slug, statut_creation, created_at')
      .eq('createurice_id', personneId)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const parType: Record<TypeCreation, Creation[]> = {
    petition: (petitions.data ?? []).map((p) => ({
      id: p.id,
      type: 'petition' as const,
      titre: p.titre,
      href: `/mobiliser/petitions/${p.slug}`,
      statut: p.statut,
      createdAt: p.created_at,
    })),
    mobilisation: (mobilisations.data ?? []).map((m) => ({
      id: m.id,
      type: 'mobilisation' as const,
      titre: m.titre,
      href: `/mobiliser/mobilisations/${m.slug}`,
      statut: m.statut,
      createdAt: m.created_at,
    })),
    campagne: (campagnes.data ?? []).map((c) => ({
      id: c.id,
      type: 'campagne' as const,
      titre: c.titre,
      href: `/mobiliser/campagnes/${c.slug}`,
      statut: c.statut,
      createdAt: c.created_at,
    })),
    cagnotte: (cagnottes.data ?? []).map((c) => ({
      id: c.id,
      type: 'cagnotte' as const,
      titre: c.titre,
      href: `/mobiliser/cagnottes/${c.slug}`,
      statut: c.statut,
      createdAt: c.created_at,
    })),
    offre_entraide: (offres.data ?? []).map((o) => ({
      id: o.id,
      type: 'offre_entraide' as const,
      titre: o.titre,
      href: `/s-entraider/offre/${o.slug}`,
      statut: o.statut,
      createdAt: o.created_at,
    })),
    service_sel: (sels.data ?? []).map((s) => ({
      id: s.id,
      type: 'service_sel' as const,
      titre: s.titre,
      href: `/s-entraider/sel/${s.slug}`,
      statut: s.statut,
      createdAt: s.created_at,
    })),
    produit_marche: (produits.data ?? []).map((p) => ({
      id: p.id,
      type: 'produit_marche' as const,
      titre: p.titre,
      href: `/s-entraider/marche/produits/${p.slug}`,
      statut: p.statut,
      createdAt: p.created_at,
    })),
    boutique_marche: (boutiques.data ?? []).map((b) => ({
      id: b.id,
      type: 'boutique_marche' as const,
      titre: b.nom,
      href: `/s-entraider/marche/boutiques/${b.slug}`,
      statut: b.statut,
      createdAt: b.created_at,
    })),
    minimarche: (minimarches.data ?? []).map((m) => ({
      id: m.id,
      type: 'minimarche' as const,
      titre: m.titre,
      href: `/s-entraider/marche/minimarches/${m.slug}`,
      statut: m.statut,
      createdAt: m.created_at,
    })),
    moment_solidaire: (moments.data ?? []).map((m) => ({
      id: m.id,
      type: 'moment_solidaire' as const,
      titre: m.titre,
      href: `/agir/moments-solidaires/${m.slug}`,
      statut: m.statut,
      createdAt: m.created_at,
    })),
    sondage: (sondages.data ?? []).map((s) => ({
      id: s.id,
      type: 'sondage' as const,
      titre: s.titre,
      href: `/s-informer/sondages/${s.slug}`,
      statut: s.statut,
      createdAt: s.created_at,
    })),
    post_reseau: (posts.data ?? []).map((p) => ({
      id: p.id,
      type: 'post_reseau' as const,
      titre: p.texte.slice(0, 80),
      href: '/s-informer/reseau',
      statut: p.statut,
      createdAt: p.created_at,
    })),
    groupe_entraide_local: (groupes.data ?? []).map((g) => ({
      id: g.id,
      type: 'groupe_entraide_local' as const,
      titre: g.nom,
      href: `/s-entraider/groupes-locaux/${g.slug}`,
      statut: g.statut,
      createdAt: g.created_at,
    })),
    commune_libre: (communes.data ?? []).map((c) => ({
      id: c.id,
      type: 'commune_libre' as const,
      titre: c.nom,
      href: `/agir/communes/${c.slug}`,
      statut: c.statut_creation,
      createdAt: c.created_at,
    })),
  };

  let total = 0;
  for (const liste of Object.values(parType)) total += liste.length;

  return { total, parType };
}
