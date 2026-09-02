import { slugDernierAppelPublie } from '@/lib/petitions/requetes';
import { NextResponse } from 'next/server';

/**
 * Adresse courte `/appel` (V2.6.136, demande de Lilou/Ben du 02/09/2026).
 *
 * L'adresse réelle d'un appel est celle de sa fiche
 * (`/mobiliser/petitions/<slug>`) : longue, pénible à dicter au téléphone, à
 * écrire sur une affiche ou à glisser dans un tract. `/appel` est la version
 * courte, et elle renvoie vers la fiche.
 *
 * **Pourquoi un gestionnaire de route (`route.ts`) et pas une page**
 * (constaté le 02/09/2026) : une page qui appelle `redirect()` ne produit PAS
 * une vraie redirection HTTP. Next.js répond 200 avec une balise
 * `<meta http-equiv="refresh" content="1;url=...">` — donc une seconde de page
 * blanche avant d'arriver, et une redirection qu'aucun outil en ligne de
 * commande ni robot ne suit. Ici on renvoie un vrai code 307 : instantané,
 * compris de tout le monde.
 *
 * Le slug n'est PAS écrit en dur : on lit à chaque fois l'appel publié le plus
 * récent. Le jour où un autre appel prendra la suite, l'adresse courte le
 * suivra sans qu'on touche au code, et elle ne pointera jamais vers un texte
 * dépublié.
 *
 * La redirection est **temporaire** (307) et non permanente : une permanente
 * serait mémorisée par les navigateurs et les moteurs de recherche, et
 * collerait `/appel` au premier appel pour toujours.
 *
 * S'il n'existe aucun appel publié, on renvoie vers la liste des pétitions
 * plutôt que sur une erreur : la personne arrive sur la page qui les recense,
 * ce qui est le plus proche de ce qu'elle cherchait.
 */
export const dynamic = 'force-dynamic';

export async function GET(requete: Request): Promise<NextResponse> {
  const slug = await slugDernierAppelPublie();

  const destination = slug === null ? '/mobiliser/petitions' : `/mobiliser/petitions/${slug}`;

  return NextResponse.redirect(new URL(destination, requete.url), 307);
}
