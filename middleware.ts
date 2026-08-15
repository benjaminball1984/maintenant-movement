import { estEnSommeil } from '@/config/rubriques';
// Import du module isolé, et non de `@/lib/payments` : l'index tire
// `MockPaymentService`, donc `node:crypto`, indisponible ici.
import { paiementReelDisponible } from '@/lib/payments/disponibilite';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Adresses qui demandent de l'argent. Elles sont fermées tant que
 * l'encaissement réel n'est pas branché (cf. `paiementReelDisponible`).
 */
const CHEMINS_PAIEMENT: ReadonlyArray<string> = ['/agir/adherer/euros'];

/**
 * Middleware Next.js : rafraîchit la session Supabase à chaque request.
 *
 * Sans ce middleware, le token d'accès expire silencieusement et les
 * Server Components reçoivent un état déconnecté alors que la personne
 * a un cookie de refresh valide. Pattern recommandé par @supabase/ssr.
 *
 * Stratégie de match : on évite les assets statiques pour ne pas
 * surcharger le runtime (les images, favicons, etc. n'ont pas besoin
 * d'un check de session).
 *
 * Tant que `NEXT_PUBLIC_SUPABASE_URL` n'est pas configuré, le middleware
 * laisse passer toutes les requêtes sans toucher à la session. Ça
 * permet au site de tourner en local sans Supabase tant qu'on ne
 * dépend pas d'auth (chantiers 0.x et début 1.x).
 */
export async function middleware(request: NextRequest) {
  // Rubriques en sommeil (cf. `config/rubriques.ts`) : on renvoie vers
  // l'accueil AVANT tout travail de session. Une adresse éteinte ne doit
  // jamais rendre de page, même partielle — c'est ce qui donnait la
  // sensation d'un site en chantier. Redirection 307 (temporaire) et non
  // 301 : la rubrique est endormie, pas supprimée ; on ne veut pas qu'un
  // navigateur ou un moteur de recherche grave la redirection en dur.
  if (estEnSommeil(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/', request.url), 307);
  }

  // Parcours de paiement fermés tant que l'encaissement n'est pas branché.
  //
  // Ce contrôle existait aussi dans la page elle-même, mais il arrivait
  // trop tard : Next.js a le temps d'envoyer le début de la page (titre
  // « Adhésion 12 € » compris) avant que la redirection ne parte. La
  // personne voyait donc apparaître une page de paiement avant d'être
  // renvoyée ailleurs. Ici, la fermeture est nette : rien n'est rendu.
  if (CHEMINS_PAIEMENT.includes(request.nextUrl.pathname) && !paiementReelDisponible()) {
    return NextResponse.redirect(new URL('/agir/adherer', request.url), 307);
  }

  // Si Supabase n'est pas configuré, on bypass : pas d'auth = pas de
  // refresh à faire. Permet le dev local sans clés.
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL === undefined ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === ''
  ) {
    return NextResponse.next();
  }

  const reponse = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        for (const { name, value, options } of cookiesToSet) {
          reponse.cookies.set(name, value, options);
        }
      },
    },
  });

  // Le simple appel à `getUser()` déclenche le refresh si nécessaire.
  await supabase.auth.getUser();

  return reponse;
}

export const config = {
  matcher: [
    /*
     * Exclure :
     *   - _next/static (assets statiques)
     *   - _next/image (optimisation d'images)
     *   - favicon, og, sitemap, robots
     *   - tout fichier avec extension (images, polices, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|og.png|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
};
