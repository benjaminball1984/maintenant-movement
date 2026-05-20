import { SITE } from '@/config/site';
import { getSupabaseServer } from '@/lib/supabase';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Layout de la console d'administration / modération (chantier 3.1).
 *
 * Filtre l'accès au niveau du segment : si la personne n'a aucun droit
 * `admin/moderation/animation/...`, on redirige vers `/connexion?prochaine=...`
 * (RLS prend en charge la sécurité fine sur les requêtes, mais on évite
 * d'afficher une page vide en filtrant ici).
 *
 * La console finale (Q10) sera multi-onglets. Pour 3.1 on pose le strict
 * minimum : un header sobre, un nav d'onglets latéraux et le `main`. Les
 * onglets supplémentaires (cagnottes, mobilisations, etc.) viendront avec
 * leurs chantiers respectifs.
 */
export default async function LayoutAdmin({ children }: { children: ReactNode }) {
  await garantirAccesAdmin('/admin/moderation/petitions');

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-display text-xl font-bold text-text-1 hover:text-brand">
              {SITE.nom}
            </Link>
            <span className="text-xs font-bold uppercase tracking-cap text-text-3">Console</span>
          </div>
          <Link href="/" className="text-sm text-text-3 hover:text-brand">
            ← Retour au site
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
        <aside className="lg:w-56 lg:shrink-0">
          <nav aria-label="Sections de modération">
            <p className="mb-3 text-xs font-bold uppercase tracking-cap text-text-3">Modération</p>
            <ul className="grid gap-1">
              <li>
                <Link
                  href="/admin/moderation/petitions"
                  className="block rounded-sm px-3 py-2 text-sm text-text-1 hover:bg-surface-2"
                >
                  Pétitions
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/moderation/campagnes"
                  className="block rounded-sm px-3 py-2 text-sm text-text-1 hover:bg-surface-2"
                >
                  Campagnes
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/moderation/mobilisations"
                  className="block rounded-sm px-3 py-2 text-sm text-text-1 hover:bg-surface-2"
                >
                  Mobilisations
                </Link>
              </li>
              <li className="px-3 py-2 text-sm text-text-4">
                Cagnottes <span className="text-xs">(3.3)</span>
              </li>
            </ul>
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

/**
 * Vérifie qu'on est connecté ET qu'on a au moins un droit admin/modération.
 *
 * Cette vérification est défensive : la RLS empêchera de toute façon les
 * lectures/écritures non autorisées. L'objectif est surtout l'UX (ne pas
 * afficher une page vide à une personne sans droits).
 */
async function garantirAccesAdmin(prochaine: string): Promise<void> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    redirect(`/connexion?prochaine=${encodeURIComponent(prochaine)}`);
  }

  const { data: estAdminGeneral } = await supabase.rpc('est_admin_general');
  if (estAdminGeneral === true) return;

  const { data: estModerateurice } = await supabase.rpc('est_moderateurice', {
    onglet_demande: null,
  });
  if (estModerateurice === true) return;

  redirect('/');
}
