import { CartePost } from '@/components/reseau/CartePost';
import { ComposerPost } from '@/components/reseau/ComposerPost';
import { Alert, Card, Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { compterMessagesNonLus, getFluxReseau } from '@/lib/reseau/requetes';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Réseau social',
  description: 'Flux sans publicité, algorithme strictement transparent et hiérarchisé.',
};

/**
 * Page `/s-informer/reseau` — flux du réseau social (chantier 7.5).
 *
 * Cf. spec §4E : flux hiérarchisé TRANSPARENT (soi -> suivi·es -> reste), sans
 * publicité ni pondération cachée, modération a posteriori, encart financement.
 */
export default async function PageReseau() {
  const session = await getSession();
  const connecte = session !== null;
  const moi = session?.userId ?? null;

  const [flux, nonLus] = await Promise.all([
    getFluxReseau(),
    connecte ? compterMessagesNonLus() : Promise.resolve(0),
  ]);

  return (
    <Container taille="md" className="py-12">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">S'informer</p>
          <Heading niveau={1}>Réseau social</Heading>
        </div>
        {connecte ? (
          <Link
            href="/s-informer/reseau/messages"
            className="text-sm font-bold text-brand hover:underline"
          >
            Mes messages{nonLus > 0 ? ` (${nonLus})` : ''}
          </Link>
        ) : null}
      </header>

      <Alert variant="info" titre="Comment ce flux est trié">
        Ordre strictement transparent : d’abord tes publications, puis celles des personnes que tu
        suis, puis le reste, du plus récent au plus ancien. Pas de publicité, pas de pondération
        cachée, pas d’autoplay.
      </Alert>

      <Card variant="ombre" className="my-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-2">
          Ce réseau n’a pas de publicité. Il vit grâce aux cotisations et aux dons.
        </p>
        <Link href="/mobiliser/cagnottes" className="text-sm font-bold text-brand hover:underline">
          Soutenir le fonctionnement
        </Link>
      </Card>

      {connecte ? (
        <div className="mb-6">
          <ComposerPost />
        </div>
      ) : (
        <Alert variant="info" className="mb-6">
          <Link href="/connexion?prochaine=/s-informer/reseau" className="underline">
            Connecte-toi
          </Link>{' '}
          pour publier, soutenir et commenter.
        </Alert>
      )}

      {flux.length === 0 ? (
        <p className="py-12 text-center text-text-3">
          Aucune publication pour l’instant.{' '}
          {connecte ? 'Sois la première personne à publier.' : ''}
        </p>
      ) : (
        <div className="grid gap-4">
          {flux.map((post) => (
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
