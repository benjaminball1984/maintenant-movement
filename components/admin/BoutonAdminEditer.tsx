import { estAdminCourant } from '@/lib/auth/admin';
import { Pencil } from 'lucide-react';
import Link from 'next/link';

/**
 * Bouton universel « Modifier en tant qu'admin » (V2.4.8).
 *
 * Server Component asynchrone : ne s'affiche QUE si l'utilisateur·ice
 * connecté·e est admin national. Pointe vers une route d'édition admin
 * passée en prop.
 *
 * Utilise un slot/Children pour pouvoir adapter le libellé selon le
 * contexte (ex. « Modérer », « Éditer la page », « Suspendre »).
 *
 * Exemple d'usage côté page espace :
 *   <BoutonAdminEditer href={`/admin/petitions/${petition.slug}`}>
 *     Modérer cette pétition
 *   </BoutonAdminEditer>
 */

interface Props {
  href: string;
  children?: React.ReactNode;
  /** Classes additionnelles (par défaut : bouton discret en haut à droite). */
  className?: string;
}

export async function BoutonAdminEditer({ href, children, className }: Props) {
  const estAdmin = await estAdminCourant();
  if (!estAdmin) return null;

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 rounded-md border border-brand bg-surface px-3 py-1.5 text-brand text-xs hover:bg-brand hover:text-bg ${className ?? ''}`}
    >
      <Pencil size={12} aria-hidden="true" />
      {children ?? 'Modifier (admin)'}
    </Link>
  );
}
