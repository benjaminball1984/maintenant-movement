/**
 * Helper de jointure « manuelle » pour récupérer les titres et slugs des
 * offres référencées par une liste de `reservation` (FK polymorphe).
 *
 * Le `reservation` V2.2.2 a une FK polymorphe `(offre_type, offre_id)`
 * sans contrainte SQL — donc pas de jointure native. Pour afficher la
 * liste « Mes réservations » avec le titre + lien vers l'offre, on
 * regroupe les ids par type d'offre puis on fait 3 requêtes max
 * (offre_entraide, service_sel, location_mutualisee).
 */

import type { Reservation } from '@/lib/reservation';
import { getSupabaseServer } from '@/lib/supabase';

export interface TitreOffre {
  titre: string;
  slug: string | null;
  cheminPage: string | null;
}

export type IndexTitres = Map<string, TitreOffre>;

/**
 * Charge le titre + slug des offres référencées par les réservations
 * passées en argument. Retourne une `Map` indexée par `offre_id` pour
 * une lecture O(1) côté caller.
 */
export async function chargerTitresOffres(
  reservations: readonly Reservation[],
): Promise<IndexTitres> {
  const map: IndexTitres = new Map();
  if (reservations.length === 0) return map;

  const idsEntraide: string[] = [];
  const idsSel: string[] = [];
  const idsLocation: string[] = [];

  for (const r of reservations) {
    if (r.offreType === 'service_sel') {
      idsSel.push(r.offreId);
    } else if (r.offreType === 'location_mutualisee') {
      idsLocation.push(r.offreId);
    } else {
      // transport_covoiturage / hebergement / pret → offre_entraide
      idsEntraide.push(r.offreId);
    }
  }

  const supabase = await getSupabaseServer();

  if (idsEntraide.length > 0) {
    const { data } = await supabase
      .from('offre_entraide')
      .select('id, titre, slug')
      .in('id', idsEntraide);
    for (const o of data ?? []) {
      map.set(o.id, {
        titre: o.titre,
        slug: o.slug,
        cheminPage: o.slug ? `/s-entraider/offre/${o.slug}` : null,
      });
    }
  }

  if (idsSel.length > 0) {
    const { data } = await supabase.from('service_sel').select('id, titre, slug').in('id', idsSel);
    for (const s of data ?? []) {
      map.set(s.id, {
        titre: s.titre,
        slug: s.slug,
        cheminPage: s.slug ? `/s-entraider/sel/${s.slug}` : null,
      });
    }
  }

  if (idsLocation.length > 0) {
    const { data } = await supabase
      .from('location_mutualisee')
      .select('id, titre, slug')
      .in('id', idsLocation);
    for (const l of data ?? []) {
      map.set(l.id, {
        titre: l.titre,
        slug: l.slug,
        // Page détail location mutualisée pas encore livrée (V2.3.3 socle backend) :
        // on ne propose pas de lien tant que la page n'existe pas.
        cheminPage: null,
      });
    }
  }

  return map;
}
