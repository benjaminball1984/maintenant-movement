'use client';

import { envoyerMessage, marquerConversationLue } from '@/app/(public)/s-informer/reseau/actions';
import { Button, Textarea } from '@/components/ui';
import type { MessageAffiche } from '@/lib/reseau/requetes';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Fil de conversation (messagerie interne). Affiche les messages échangés avec
 * une personne et permet de répondre. Marque la conversation comme lue à
 * l'ouverture.
 */
export function FilConversation({
  autreId,
  autreNom,
  messages,
}: {
  autreId: string;
  autreNom: string;
  messages: MessageAffiche[];
}) {
  const router = useRouter();
  const [texte, setTexte] = useState('');
  const [enCours, setEnCours] = useState(false);

  // Marque les messages reçus comme lus à l'ouverture du fil.
  useEffect(() => {
    void marquerConversationLue({ cible_id: autreId });
  }, [autreId]);

  const envoyer = async (evenement: React.FormEvent) => {
    evenement.preventDefault();
    setEnCours(true);
    const resultat = await envoyerMessage({ destinataire_id: autreId, texte });
    setEnCours(false);
    if (resultat.ok) {
      setTexte('');
      router.refresh();
    }
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-2" aria-live="polite">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-text-3">
            Aucun message. Écris le premier à {autreNom}.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.deMoi
                  ? 'justify-self-end bg-brand text-white'
                  : 'justify-self-start bg-surface-2 text-text-1'
              }`}
            >
              {/* Émetteur lisible par lecteur d'écran : le sens ne dépend plus que de la couleur de bulle. */}
              <span className="sr-only">{m.deMoi ? 'Toi : ' : `${autreNom} : `}</span>
              <p className="whitespace-pre-wrap break-words">{m.texte}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={envoyer} className="grid gap-2 border-t border-border pt-3">
        <Textarea
          rows={2}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder={`Message à ${autreNom}...`}
          maxLength={5000}
        />
        <div className="flex justify-end">
          <Button type="submit" taille="sm" disabled={enCours || texte.trim() === ''}>
            {enCours ? 'Envoi...' : 'Envoyer'}
          </Button>
        </div>
      </form>
    </div>
  );
}
