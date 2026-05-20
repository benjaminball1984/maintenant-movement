import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import type { ReactNode } from 'react';

/**
 * Layout des pages publiques (groupe (public)).
 *
 * Pose le Header sticky en haut et le Footer en bas. Toutes les pages
 * de l'espace public héritent de cette chrome.
 */
export default function LayoutPublic({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
