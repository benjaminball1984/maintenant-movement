'use client';

import { seDeconnecter } from '@/app/(auth)/actions';
import { cn } from '@/lib/utils';
import { ChevronDown, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface HeaderProfilMenuProps {
  email: string;
  prenom: string | null;
}

/**
 * Menu déroulant du profil dans le Header.
 *
 * Affiche le prénom (ou l'email tronqué à défaut) + un chevron, ouvre un
 * dropdown avec : lien vers le profil, bouton déconnexion.
 *
 * Ferme automatiquement sur clic extérieur ou touche Échap.
 * Accessibilité : `aria-haspopup`, `aria-expanded`, focus visible.
 */
export function HeaderProfilMenu({ email, prenom }: HeaderProfilMenuProps) {
  const [ouvert, setOuvert] = useState(false);
  const [deconnexionEnCours, setDeconnexionEnCours] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    function gererClicExterieur(evenement: MouseEvent) {
      if (containerRef.current?.contains(evenement.target as Node) === false) {
        setOuvert(false);
      }
    }
    function gererEchap(evenement: KeyboardEvent) {
      if (evenement.key === 'Escape') {
        setOuvert(false);
      }
    }
    document.addEventListener('mousedown', gererClicExterieur);
    document.addEventListener('keydown', gererEchap);
    return () => {
      document.removeEventListener('mousedown', gererClicExterieur);
      document.removeEventListener('keydown', gererEchap);
    };
  }, [ouvert]);

  const libelleBouton = prenom !== null && prenom.length > 0 ? prenom : email.split('@')[0];

  async function gererDeconnexion() {
    setDeconnexionEnCours(true);
    await seDeconnecter();
    // Redirection côté Server Action.
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={ouvert}
        onClick={() => setOuvert((v) => !v)}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium text-text-1 hover:bg-surface-2"
      >
        <User size={16} strokeWidth={1.75} aria-hidden="true" />
        <span className="max-w-[10rem] truncate">{libelleBouton}</span>
        <ChevronDown
          size={14}
          strokeWidth={1.75}
          aria-hidden="true"
          className={cn('transition-transform', ouvert && 'rotate-180')}
        />
      </button>

      {ouvert ? (
        <div
          role="menu"
          aria-label="Menu profil"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-md border border-border bg-surface shadow-md"
        >
          <div className="border-b border-border px-3 py-2 text-xs text-text-3">{email}</div>
          <Link
            href="/profil/dashboard"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-text-1 hover:bg-surface-2"
            onClick={() => setOuvert(false)}
          >
            <User size={14} strokeWidth={1.75} />
            Mon profil
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={gererDeconnexion}
            disabled={deconnexionEnCours}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-1 hover:bg-surface-2 disabled:opacity-50"
          >
            <LogOut size={14} strokeWidth={1.75} />
            {deconnexionEnCours ? 'Déconnexion...' : 'Se déconnecter'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
