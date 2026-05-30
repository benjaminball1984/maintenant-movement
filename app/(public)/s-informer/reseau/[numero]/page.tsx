import { AvatarReseau } from '@/components/reseau/AvatarReseau';
import { BoutonAmitie } from '@/components/reseau/BoutonAmitie';
import { BoutonSuivre } from '@/components/reseau/BoutonSuivre';
import { CartePost } from '@/components/reseau/CartePost';
import { ModaleMessage } from '@/components/reseau/ModaleMessage';
import { RenduRiche } from '@/components/rich-text/RenduRiche';
import { Badge, Button, Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { etatAmitieAvec } from '@/lib/reseau/amitie';
import { getProfilReseauParNumero, listerPostsDePersonne, nomAffiche } from '@/lib/reseau/requetes';
import { cn } from '@/lib/utils';
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
  // Chantier D.1 : état d'amitié (demande/accept) entre le lecteur et la cible.
  const etatAmitie = connecte && !profil.estMoi ? await etatAmitieAvec(profil.personneId) : null;

  return (
    <Container taille="md" className="pb-12">
      <p className="px-4 pt-6 pb-2 text-xs font-bold uppercase tracking-cap text-text-3 sm:px-0">
        <Link href="/s-informer/reseau" className="hover:text-brand">
          ← Réseau social
        </Link>
      </p>

      {/* V2.5.13 Phase J — bandeau de couverture du profil.
          Si `coverUrl` est renseigné, on l'utilise comme arrière-plan
          (V2.5.13.a). Sinon, on retombe sur le dégradé identitaire `bg-grad`.
          L'avatar dépasse en bas avec une bordure surface qui le met en relief. */}
      <div className="relative mb-16">
        {profil.coverUrl !== null ? (
          <div
            className="h-32 rounded-lg bg-grad bg-center bg-cover shadow-brand/30 shadow-inner sm:h-48"
            style={{ backgroundImage: `url(${profil.coverUrl})` }}
            role="img"
            aria-label="Couverture du profil"
          />
        ) : (
          <div
            className={cn('h-32 sm:h-48 rounded-lg bg-grad', 'shadow-brand/30 shadow-inner')}
            aria-hidden="true"
          />
        )}
        <div className="-bottom-12 absolute left-4 sm:left-6">
          <div className="rounded-full border-4 border-surface bg-surface p-0">
            <AvatarReseau nom={nom} photoUrl={profil.photoUrl} taillePx={96} />
          </div>
        </div>
      </div>

      <header className="mb-8 grid gap-3 px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <Heading niveau={1}>{nom}</Heading>
              {profil.estAmi ? <Badge variant="accent">Ami·e</Badge> : null}
            </div>
            {profil.pronom !== null && profil.pronom.trim() !== '' ? (
              <p className="text-sm text-text-3">{profil.pronom}</p>
            ) : null}
            <p className="font-mono text-sm text-text-3">{profil.numero}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {profil.estMoi ? (
              <Link href="/profil/informations">
                <Button variant="outline" taille="sm">
                  Modifier mon profil
                </Button>
              </Link>
            ) : connecte ? (
              <>
                <BoutonSuivre cibleId={profil.personneId} jeSuisInitial={profil.jeSuis} />
                {etatAmitie !== null ? (
                  <BoutonAmitie cibleId={profil.personneId} etat={etatAmitie} />
                ) : null}
                <ModaleMessage destinataireId={profil.personneId} destinataireNom={nom} />
              </>
            ) : (
              <Link href={`/connexion?prochaine=/s-informer/reseau/${profil.numero}`}>
                <Button taille="sm">Se connecter pour interagir</Button>
              </Link>
            )}
          </div>
        </div>

        {profil.bioHtml !== null && profil.bioHtml.trim() !== '' ? (
          // V2.5.49 — bio rich text (déjà sanitizée au save). V2.5.55 — rendu
          // via RenduRiche (chemin canonique). Le parent max-w-2xl contraint
          // la largeur (RenduRiche pose max-w-none en interne).
          <div className="max-w-2xl">
            <RenduRiche valeurHtml={profil.bioHtml} className="leading-relaxed text-text-2" />
          </div>
        ) : profil.bio !== null && profil.bio.trim() !== '' ? (
          <p className="max-w-2xl leading-relaxed text-text-2">{profil.bio}</p>
        ) : null}

        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-3">
          <span>
            <strong className="text-text-1">{profil.nbAbonnes}</strong> abonné·e
            {profil.nbAbonnes > 1 ? 's' : ''}
          </span>
          <span>
            <strong className="text-text-1">{profil.nbSuivis}</strong> suivi·e
            {profil.nbSuivis > 1 ? 's' : ''}
          </span>
        </p>
      </header>

      <Heading niveau={2} className="mb-4 px-4 text-lg sm:px-6">
        Publications
      </Heading>
      {posts.length === 0 ? (
        <p className="py-8 text-center text-text-3">Aucune publication.</p>
      ) : (
        <div className="grid gap-4 px-4 sm:px-6">
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
