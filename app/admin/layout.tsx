import { SITE } from '@/config/site';
import { estAdminNational } from '@/lib/admin/national/garde';
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

  // La console nationale n'est proposée qu'aux admins du niveau le plus élevé.
  const peutNational = await estAdminNational();

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
          <nav aria-label="Console d'administration">
            <p className="mb-3 text-xs font-bold uppercase tracking-cap text-text-3">
              Tableau de bord
            </p>
            <ul className="mb-4 grid gap-1">
              <li>
                <Link
                  href="/admin"
                  className="block rounded-sm px-3 py-2 text-sm text-text-1 hover:bg-surface-2"
                >
                  Vue d'ensemble
                </Link>
              </li>
            </ul>
            <p className="mb-3 text-xs font-bold uppercase tracking-cap text-text-3">Modération</p>
            <ul className="grid gap-1">
              {[
                { href: '/admin/moderation/petitions', libelle: 'Pétitions' },
                { href: '/admin/moderation/campagnes', libelle: 'Campagnes' },
                { href: '/admin/moderation/mobilisations', libelle: 'Mobilisations' },
                { href: '/admin/moderation/cagnottes', libelle: 'Cagnottes' },
                { href: '/admin/moderation/media', libelle: 'Médias' },
                { href: '/admin/moderation/sel', libelle: 'SEL' },
                { href: '/admin/moderation/marche', libelle: 'Marché solidaire' },
                { href: '/admin/moderation/moments', libelle: 'Moments' },
                { href: '/admin/moderation/sondages', libelle: 'Sondages' },
                { href: '/admin/moderation/autres-moyens', libelle: 'Autres moyens' },
              ].map((onglet) => (
                <li key={onglet.href}>
                  <Link
                    href={onglet.href}
                    className="block rounded-sm px-3 py-2 text-sm text-text-1 hover:bg-surface-2"
                  >
                    {onglet.libelle}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 mb-3 text-xs font-bold uppercase tracking-cap text-text-3">
              Gestion
            </p>
            <ul className="grid gap-1">
              <li>
                <Link
                  href="/admin/petitions"
                  className="block rounded-sm px-3 py-2 text-sm text-text-1 hover:bg-surface-2"
                >
                  Pétitions (édition)
                </Link>
              </li>
            </ul>

            {peutNational ? (
              <>
                <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-cap text-text-3">
                  Console nationale
                </p>
                <ul className="grid gap-1">
                  {[
                    { href: '/admin/national', libelle: 'Vue nationale' },
                    { href: '/admin/national/droits', libelle: 'Gestion des droits' },
                  ].map((onglet) => (
                    <li key={onglet.href}>
                      <Link
                        href={onglet.href}
                        className="block rounded-sm px-3 py-2 text-sm text-text-1 hover:bg-surface-2"
                      >
                        {onglet.libelle}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
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

  const { data: estModerateurice } = await supabase.rpc('est_moderateurice', {});
  if (estModerateurice === true) return;

  redirect('/');
}
