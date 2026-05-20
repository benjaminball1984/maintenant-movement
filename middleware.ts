import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

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
