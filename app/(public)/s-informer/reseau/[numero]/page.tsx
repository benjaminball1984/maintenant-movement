import { AvatarReseau } from '@/components/reseau/AvatarReseau';
import { BoutonSuivre } from '@/components/reseau/BoutonSuivre';
import { CartePost } from '@/components/reseau/CartePost';
import { ModaleMessage } from '@/components/reseau/ModaleMessage';
import { Badge, Button, Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { getProfilReseauParNumero, listerPostsDePersonne, nomAffiche } from '@/lib/reseau/requetes';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProfilProps {
  params: Promise<{ numero: string }>;
}

export async function generateMetadata({ params }: PageProfilProps): Promise<Metadata> {
  const { numero } = await params;
  const profil = await getProfilReseauParNumero(numero);
  if (profil === null) return { title: 'Profil introuvable' };
  return { title: `${nomAffiche(profil.prenom, profil.nom)} sur le réseau` };
}

/**
 * Page profil réseau social `/s-informer/reseau/[numero]` (chantier 7.5).
 *
 * Le `numero` est le numéro public M+7 de la personne. Identité affichée dans le
 * respect de `preferences_visibilite` (champs masqués si non visibles).
 */
export default async function PageProfilReseau({ params }: PageProfilProps) {
  const { numero } = await params;
  const profil = await getProfilReseauParNumero(numero);
  if (profil === null) notFound();

  const session = await getSession();
  const connecte = session !== null;
  const moi = session?.userId ?? null;
  const nom = nomAffiche(profil.prenom, profil.nom);
  const posts = await listerPostsDePersonne(profil.personneId);

  return (
    <Container taille="md" className="py-12">
      <p className="mb-4 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/s-informer/reseau" className="hover:text-brand">
          ← Réseau social
        </Link>
      </p>

      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start">
        <AvatarReseau nom={nom} photoUrl={profil.photoUrl} taillePx={80} />
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Heading niveau={1}>{nom}</Heading>
            {profil.estAmi ? <Badge variant="accent">Ami·e</Badge> : null}
          </div>
          {profil.pronom !== null && profil.pronom.trim() !== '' ? (
            <p className="text-sm text-text-3">{profil.pronom}</p>
          ) : null}
          <p className="font-mono text-sm text-text-3">{profil.numero}</p>
          {profil.bio !== null && profil.bio.trim() !== '' ? (
            <p className="text-text-2">{profil.bio}</p>
          ) : null}
          <p className="text-sm text-text-3">
            {profil.nbAbonnes} abonné·e{profil.nbAbonnes > 1 ? 's' : ''} · {profil.nbSuivis} suivi·e
            {profil.nbSuivis > 1 ? 's' : ''}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {profil.estMoi ? (
              <Link href="/profil/informations">
                <Button variant="outline" taille="sm">
                  Modifier mon profil
                </Button>
              </Link>
            ) : connecte ? (
              <>
                <BoutonSuivre cibleId={profil.personneId} jeSuisInitial={profil.jeSuis} />
                <ModaleMessage destinataireId={profil.personneId} destinataireNom={nom} />
              </>
            ) : (
              <Link href={`/connexion?prochaine=/s-informer/reseau/${profil.numero}`}>
                <Button taille="sm">Se connecter pour interagir</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <Heading niveau={2} className="mb-4 text-lg">
        Publications
      </Heading>
      {posts.length === 0 ? (
        <p className="py-8 text-center text-text-3">Aucune publication.</p>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <CartePost
              key={post.id}
              post={post}
              connecte={connecte}
              estMien={post.auteur.personneId === moi}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
