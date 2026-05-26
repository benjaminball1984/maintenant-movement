import { type EspaceTypeFil, listerMessagesFil } from '@/lib/fil-groupe';
import { getSupabaseServer } from '@/lib/supabase';
import { FormulairePosterMessage } from './FormulairePosterMessage';
import { MessageFilAffiche } from './MessageFilAffiche';

/**
 * Composant principal du fil de discussion d'un espace (cycle V2 §18,
 * chantier V2.2.1).
 *
 * Server Component qui :
 * 1. Charge les messages actifs du fil (RLS filtre aux membres).
 * 2. Fait une jointure « légère » avec `personne` pour afficher le prénom
 *    de l'auteur sur chaque message.
 * 3. Rend le formulaire client de saisie en pied de fil.
 *
 * À utiliser depuis n'importe quelle page d'espace (commune, campagne,
 * GT, etc.) en passant `espaceType` et `espaceId`. L'intégration profonde
 * dans chaque sous-espace est un chantier V2.3 dédié.
 */

export interface FilDeGroupeProps {
  espaceType: EspaceTypeFil;
  espaceId: string;
  /** Chemin à revalider après une action (revalidatePath). */
  cheminRevalidation?: string;
  /** Limite d'affichage initial. */
  limite?: number;
}

export async function FilDeGroupe({
  espaceType,
  espaceId,
  cheminRevalidation,
  limite = 30,
}: FilDeGroupeProps) {
  const messages = await listerMessagesFil({ espaceType, espaceId, limite });

  // Jointure légère : on récupère prénom/nom de tous les auteurs en une
  // seule requête, indexée par id pour le rendu.
  const idsAuteurs = Array.from(new Set(messages.map((m) => m.auteurId)));
  const auteurs = await chargerAuteurs(idsAuteurs);

  return (
    <section
      aria-label="Fil de discussion du groupe"
      className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4"
    >
      <header>
        <h2 className="font-display font-bold text-lg text-text-1">Fil de discussion</h2>
        <p className="text-sm text-text-3">
          {messages.length === 0
            ? 'Aucun message pour l’instant. Sois la première personne à poster.'
            : `${messages.length} message${messages.length > 1 ? 's' : ''} récents`}
        </p>
      </header>

      {messages.length > 0 && (
        <ol className="flex flex-col gap-3">
          {messages.map((message) => (
            <li key={message.id}>
              <MessageFilAffiche message={message} auteur={auteurs.get(message.auteurId) ?? null} />
            </li>
          ))}
        </ol>
      )}

      <FormulairePosterMessage
        espaceType={espaceType}
        espaceId={espaceId}
        cheminRevalidation={cheminRevalidation}
      />
    </section>
  );
}

interface AuteurAffichable {
  prenom: string | null;
  nom: string | null;
}

async function chargerAuteurs(ids: readonly string[]): Promise<Map<string, AuteurAffichable>> {
  if (ids.length === 0) return new Map();
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('personne')
    .select('id, prenom, nom')
    .in('id', ids as string[]);
  const m = new Map<string, AuteurAffichable>();
  for (const p of data ?? []) {
    m.set(p.id, { prenom: p.prenom ?? null, nom: p.nom ?? null });
  }
  return m;
}
