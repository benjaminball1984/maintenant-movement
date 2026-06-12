import { creerSondage } from '@/app/(public)/s-informer/sondages/actions';
import { FormulaireCreationSondage } from '@/components/sondages/FormulaireCreationSondage';
import { Container, Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Créer un sondage' };

export default async function PageNouveauSondage() {
  await getSessionOuRediriger('/s-informer/sondages/nouveau');
  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/s-informer/sondages" className="hover:text-brand">
          Retour
        </Link>
      </p>
      <Heading niveau={1}>Créer un sondage</Heading>
      <p className="mt-3 max-w-2xl text-text-2">
        Vote connecté obligatoire (cf. doctrine §4D). Les résultats s’affichent en brut tant qu’il
        n’y a pas assez de répondant·es, puis en pondéré (méthode des quotas) dès 300 répondant·es ;
        chaque visiteur·euse peut basculer entre les deux vues.
      </p>
      <div className="mt-8">
        <FormulaireCreationSondage creerSondage={creerSondage} />
      </div>
    </Container>
  );
}
