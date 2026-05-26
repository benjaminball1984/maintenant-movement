import type { MessageFil } from '@/lib/fil-groupe';

/**
 * Rend un message du fil de groupe (cycle V2 §18, V2.2.1).
 *
 * Server Component : pas d'état, pas d'interactivité (les actions de
 * suppression / édition viendront via formulaires Server Action dans un
 * chantier de modération dédié).
 */

interface MessageFilAfficheProps {
  message: MessageFil;
  auteur: { prenom: string | null; nom: string | null } | null;
}

const FORMAT_DATE = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function MessageFilAffiche({ message, auteur }: MessageFilAfficheProps) {
  const dateLisible = FORMAT_DATE.format(new Date(message.createdAt));
  const nomAffiche = nomLisible(auteur);

  return (
    <article className="rounded-md border border-border bg-surface-2 p-3">
      <header className="flex items-baseline gap-2 text-sm">
        <span className="font-bold text-text-1">{nomAffiche}</span>
        <time
          className="text-text-3 text-xs"
          dateTime={message.createdAt}
          title={message.createdAt}
        >
          {dateLisible}
        </time>
      </header>
      <p className="mt-1 whitespace-pre-wrap text-text-1 text-sm">{message.contenu}</p>
    </article>
  );
}

function nomLisible(auteur: { prenom: string | null; nom: string | null } | null): string {
  if (auteur === null) return 'Membre';
  const prenom = (auteur.prenom ?? '').trim();
  const nom = (auteur.nom ?? '').trim();
  if (prenom === '' && nom === '') return 'Membre';
  if (prenom === '') return nom;
  return prenom;
}
