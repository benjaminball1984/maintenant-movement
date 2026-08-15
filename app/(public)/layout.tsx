import { BlocNewsletter } from '@/components/layout/BlocNewsletter';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { LienEvitement } from '@/components/layout/LienEvitement';
import type { ReactNode } from 'react';

/**
 * Layout des pages publiques (groupe (public)).
 *
 * Pose le Header sticky en haut, le bloc newsletter et le Footer en bas.
 * Toutes les pages de l'espace public héritent de cette chrome.
 *
 * Le bloc newsletter est ici plutôt que dans chaque page (décision
 * Lilou/Ben du 01/08/2026) : on doit pouvoir s'inscrire depuis n'importe
 * quelle page, sans fenêtre surgissante.
 */
export default function LayoutPublic({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <LienEvitement />
      <Header />
      <main id="contenu" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <BlocNewsletter />
      <Footer />
    </div>
  );
}
