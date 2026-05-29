import { Button, Card, Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { Heart, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Bienvenue dans le mouvement',
  description: 'Après avoir signé, voici comment aller plus loin avec Maintenant!.',
};

/**
 * Page intermédiaire « après signature » (V2.5.19 — Master Plan V2.6 Phase E
 * sous-chantier V2.5.6.a).
 *
 * Accédée depuis l'écran de merci de la modale signature pétition. Présente
 * deux portes claires (adhérer + rejoindre une commune) avec contextualisation
 * « tu viens de signer ». Si la personne est connectée, lien direct vers les
 * formulaires. Sinon, lien vers /inscription avec retour prévu.
 *
 * Cette page n'utilise pas les query params pour pré-remplir les formulaires
 * d'adhésion (cela nécessiterait de modifier les pages enfants `/agir/adherer/*`
 * qui exigent une session). Le pré-remplissage complet est reporté à V2.5.6.a.bis
 * quand le flux email de confirmation sera branché : l'email contiendra un lien
 * unique qui crée le compte d'abord, puis pré-remplit.
 */
export default async function PageDepuisPetition() {
  const session = await getSession();
  const connecte = session !== null;

  return (
    <Container taille="md" className="py-12">
      <header className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">Bienvenue</p>
        <Heading niveau={1} className="mt-2 bg-grad bg-clip-text text-transparent">
          Merci pour ta signature
        </Heading>
        <p className="mt-3 max-w-2xl mx-auto text-text-2">
          Ton signal politique est enregistré. Si tu veux aller plus loin, deux portes simples
          s'ouvrent à toi. Aucune n'est obligatoire — tu choisis.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Carte adhésion */}
        <Card variant="ombre" className="flex flex-col gap-3 border-brand/20">
          <Heart size={28} strokeWidth={1.5} className="text-brand" aria-hidden="true" />
          <Heading niveau={2} apparenceComme={3}>
            Devenir adhérent·e
          </Heading>
          <p className="text-sm text-text-2 flex-1">
            Trois chemins au choix, sans aucune barrière financière : gratuit, 12 € ou 12 99-coin.
            Tu participeras aux votes en assemblée confédérale et tu pourras lancer tes propres
            pétitions et mobilisations.
          </p>
          {connecte ? (
            <Link href="/agir/adherer">
              <Button>Voir les 3 chemins d'adhésion</Button>
            </Link>
          ) : (
            <div className="grid gap-2">
              <Link href="/connexion?prochaine=/agir/adherer">
                <Button>Me connecter pour adhérer</Button>
              </Link>
              <Link
                href="/inscription?prochaine=/agir/adherer"
                className="text-sm text-brand hover:underline text-center"
              >
                Pas encore de compte ? Créer un compte
              </Link>
            </div>
          )}
        </Card>

        {/* Carte commune */}
        <Card variant="ombre" className="flex flex-col gap-3 border-brand/20">
          <MapPin size={28} strokeWidth={1.5} className="text-brand" aria-hidden="true" />
          <Heading niveau={2} apparenceComme={3}>
            Rejoindre une commune libre
          </Heading>
          <p className="text-sm text-text-2 flex-1">
            Les communes libres sont les groupes locaux du mouvement. On y discute, on s'organise,
            on agit. Rejoins la commune libre de chez toi en un clic, ou explore celles qui
            existent.
          </p>
          {connecte ? (
            <Link href="/agir/communes/pres-de-chez-moi">
              <Button variant="outline">Trouver des gens près de chez moi</Button>
            </Link>
          ) : (
            <div className="grid gap-2">
              <Link href="/connexion?prochaine=/agir/communes/pres-de-chez-moi">
                <Button variant="outline">Me connecter pour rejoindre</Button>
              </Link>
              <Link
                href="/agir/communes"
                className="text-sm text-brand hover:underline text-center"
              >
                Ou explorer toutes les communes
              </Link>
            </div>
          )}
        </Card>
      </div>

      <p className="mt-8 text-center text-sm text-text-3">
        Tu peux aussi simplement{' '}
        <Link href="/" className="text-brand hover:underline">
          retourner à l'accueil
        </Link>{' '}
        — ta signature est enregistrée dans tous les cas.
      </p>
    </Container>
  );
}
