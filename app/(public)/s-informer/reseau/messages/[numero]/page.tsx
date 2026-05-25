import { AvatarReseau } from '@/components/reseau/AvatarReseau';
import { FilConversation } from '@/components/reseau/FilConversation';
import { Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import {
  getProfilReseauParNumero,
  listerFilMessages,
  nomAffiche,
} from '@/lib/reseau/requetes';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

interface PageFilProps {
  params: Promise<{ numero: string }>;
}

export const metadata: Metadata = { title: 'Conversation' };

/**
 * Page `/s-informer/reseau/messages/[numero]` — fil de conversation avec une
 * personne (identifiée par son numéro public M+7).
 */
export default async function PageFil({ params }: PageFilProps) {
  const { numero } = await params;
  const session = await getSession();
  if (session === null) {
    redirect(`/connexion?prochaine=/s-informer/reseau/messages/${numero}`);
  }

  const profil = await getProfilReseauParNumero(numero);
  if (profil === null) notFound();

  const nom = nomAffiche(profil.prenom, profil.nom);
  const messages = await listerFilMessages(profil.personneId);

  return (
    <Container taille="md" className="py-12">
      <p className="mb-4 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/s-informer/reseau/messages" className="hover:text-brand">
          ← Mes messages
        </Link>
      </p>

      <header className="mb-6 flex items-center gap-3">
        <AvatarReseau nom={nom} photoUrl={profil.photoUrl} taillePx={44} />
        <div>
          <Heading niveau={1} className="text-lg">
            {nom}
          </Heading>
          <Link
            href={`/s-informer/reseau/${profil.numero}`}
            className="text-xs text-text-3 hover:text-brand"
          >
            Voir le profil
          </Link>
        </div>
      </header>

      <FilConversation autreId={profil.personneId} autreNom={nom} messages={messages} />
    </Container>
  );
}
