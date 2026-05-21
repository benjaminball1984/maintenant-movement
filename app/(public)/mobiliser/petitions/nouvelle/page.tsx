import { FormulaireCreationPetition } from '@/components/petitions/FormulaireCreationPetition';
import { Alert, Container, Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';
import { creerPetition } from '../actions';

export const metadata: Metadata = {
  title: 'Lancer une pétition',
  description: 'Lance une pétition citoyenne sur Maintenant!. Modération a priori sous 24-48 h.',
};

/**
 * Page de création d'une pétition (`/mobiliser/petitions/nouvelle`, chantier 3.1).
 *
 * Auth requise : si la personne n'est pas connectée, redirige vers
 * `/connexion?prochaine=...`. Le formulaire envoie une Server Action qui
 * crée la pétition au statut `en_moderation`. Modération a priori sous
 * 24-48 heures.
 */
export default async function PageCreationPetition() {
  // Force l'auth ; redirige vers /connexion si besoin.
  await getSessionOuRediriger('/mobiliser/petitions/nouvelle');

  return (
    <Container taille="md" className="py-12">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">
          <Link href="/mobiliser/petitions" className="hover:text-brand">
            ← Toutes les pétitions
          </Link>
        </p>
        <Heading niveau={1} className="mt-1">
          Lancer une pétition
        </Heading>
        <p className="mt-3 max-w-2xl text-text-2">
          Ta pétition sera examinée par l'équipe Maintenant! avant publication. Délai habituel : 24
          à 48 heures. Plus le titre est clair et le texte argumenté, plus la modération est rapide.
        </p>
      </header>

      <Alert variant="info" titre="Conditions de publication">
        <ul className="ml-4 list-disc space-y-1">
          <li>Une pétition cible un destinataire précis (institution, élu·e, entreprise).</li>
          <li>
            Le texte décrit le problème et la demande. Pas de propos haineux ni d'attaque
            personnelle.
          </li>
          <li>L'objectif chiffré est réaliste. Au franchissement de 90 %, il sera étiré ×1,5.</li>
        </ul>
      </Alert>

      <div className="mt-8">
        <FormulaireCreationPetition creerPetition={creerPetition} />
      </div>
    </Container>
  );
}
