import { AvatarReseau } from '@/components/reseau/AvatarReseau';
import { ModaleMessage } from '@/components/reseau/ModaleMessage';
import type { MembreCommune } from '@/lib/communes/membres';
import Link from 'next/link';

/**
 * Liste des co-membres d'une commune, affichée UNIQUEMENT entre membres
 * (décision A). Nom complet cliquable vers le profil réseau + bouton message.
 * Objectif : favoriser les interactions et l'usage du réseau social.
 */
export function ListeMembres({ membres, moiId }: { membres: MembreCommune[]; moiId: string }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {membres.map((m) => {
        const estMoi = m.personneId === moiId;
        return (
          <li
            key={m.personneId}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
          >
            <AvatarReseau nom={m.nom} photoUrl={m.photoUrl} taillePx={40} />
            <div className="min-w-0 flex-1">
              {m.numero !== null ? (
                <Link
                  href={`/s-informer/reseau/${m.numero}`}
                  className="font-bold text-text-1 hover:text-brand"
                >
                  {m.nom}
                </Link>
              ) : (
                <p className="font-bold text-text-1">{m.nom}</p>
              )}
              {estMoi ? <span className="ml-1 text-xs text-text-3">(toi)</span> : null}
            </div>
            {!estMoi ? (
              <ModaleMessage
                destinataireId={m.personneId}
                destinataireNom={m.nom}
                libelleBouton="Message"
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
