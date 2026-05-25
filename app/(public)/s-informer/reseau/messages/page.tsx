import { AvatarReseau } from '@/components/reseau/AvatarReseau';
import { Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { type Conversation, listerConversations, nomAffiche } from '@/lib/reseau/requetes';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Mes messages' };

/** Format court d'une date de message. */
function formaterDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(iso),
  );
}

/**
 * Page `/s-informer/reseau/messages` — liste des conversations (messagerie
 * interne du réseau social, chantier 7.5).
 */
export default async function PageMessages() {
  const session = await getSession();
  if (session === null) {
    redirect('/connexion?prochaine=/s-informer/reseau/messages');
  }

  const conversations = await listerConversations();

  return (
    <Container taille="md" className="py-12">
      <p className="mb-4 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/s-informer/reseau" className="hover:text-brand">
          ← Réseau social
        </Link>
      </p>
      <Heading niveau={1} className="mb-6">
        Mes messages
      </Heading>

      {conversations.length === 0 ? (
        <p className="py-12 text-center text-text-3">
          Aucune conversation pour l’instant. Écris à quelqu’un depuis son profil.
        </p>
      ) : (
        <ul className="grid gap-2">
          {conversations.map((c: Conversation) => {
            const nom = nomAffiche(c.autre.prenom, c.autre.nom);
            return (
              <li key={c.autre.personneId}>
                <Link
                  href={c.autre.numero !== null ? `/s-informer/reseau/messages/${c.autre.numero}` : '#'}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 hover:border-border-dark"
                >
                  <AvatarReseau nom={nom} photoUrl={c.autre.photoUrl} taillePx={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-text-1">{nom}</p>
                      <span className="shrink-0 text-xs text-text-3">{formaterDate(c.dernierLe)}</span>
                    </div>
                    <p className="truncate text-sm text-text-2">{c.dernierTexte}</p>
                  </div>
                  {c.nonLus > 0 ? (
                    <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">
                      {c.nonLus}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
