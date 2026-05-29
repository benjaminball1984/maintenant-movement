import { CartePost } from '@/components/reseau/CartePost';
import { Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import type { TypeEspacePostable } from '@/lib/reseau/espace';
import { listerPostsDeLEspace } from '@/lib/reseau/requetes';
import { Megaphone } from 'lucide-react';

interface FilEspacePublicProps {
  espaceType: TypeEspacePostable;
  espaceId: string;
  /** Titre de la section (ex. « Publications de la commune »). Optionnel. */
  titre?: string;
}

/**
 * Section « Fil propre » d'un espace collectif (V2.5.18 finition Phase H,
 * sous-chantier V2.5.10.c). Liste les posts publiés au nom de l'espace,
 * affichés en utilisant le même `<CartePost>` que le flux principal du
 * réseau social — donc avec le badge espace qui pointe vers cette page
 * (chemin circulaire visuellement cohérent).
 *
 * Server Component : lit la session pour passer `connecte` et `estMien`
 * à chaque CartePost (un membre peut supprimer son propre post même publié
 * au nom de l'espace).
 *
 * Ne rend rien si l'espace n'a aucune publication (pas de pollution
 * visuelle). À placer après le composer dans la page de l'espace.
 */
export async function FilEspacePublic({
  espaceType,
  espaceId,
  titre = "Publications de l'espace",
}: FilEspacePublicProps) {
  const [posts, session] = await Promise.all([
    listerPostsDeLEspace(espaceType, espaceId),
    getSession(),
  ]);

  if (posts.length === 0) return null;

  const connecte = session !== null;
  const moi = session?.userId ?? null;

  return (
    <section aria-label="Fil de l'espace dans le réseau social" className="grid gap-4">
      <Heading niveau={2} apparenceComme={3} className="flex items-center gap-2">
        <Megaphone size={20} strokeWidth={1.5} className="text-brand" aria-hidden="true" />
        {titre}
      </Heading>
      <div className="grid gap-3">
        {posts.map((post) => (
          <CartePost
            key={post.id}
            post={post}
            connecte={connecte}
            estMien={post.auteur.personneId === moi}
          />
        ))}
      </div>
    </section>
  );
}
