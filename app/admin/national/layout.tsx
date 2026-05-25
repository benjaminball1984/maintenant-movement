import { garantirAdminNational } from '@/lib/admin/national/garde';
import type { ReactNode } from 'react';

/**
 * Layout de la console nationale (« super admin »).
 *
 * Garde d'accès du sous-arbre `/admin/national/*` : seul le niveau
 * `national` y entre (les autres droits admin sont renvoyés vers `/admin`).
 * La présentation (header, nav latérale) est fournie par le layout parent
 * `/admin` ; on n'ajoute ici que la barrière d'accès.
 */
export default async function LayoutNational({ children }: { children: ReactNode }) {
  await garantirAdminNational('/admin/national');
  return <>{children}</>;
}
