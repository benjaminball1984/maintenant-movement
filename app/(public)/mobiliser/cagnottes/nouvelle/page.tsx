import { FormulaireCreationCagnotte } from '@/components/cagnottes/FormulaireCreationCagnotte';
import { Container, Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import type { Metadata } from 'next';
import Link from 'next/link';
import { creerCagnotte } from '../actions';

export const metadata: Metadata = {
  title: 'Créer une cagnotte',
};

export default async function PageCreationCagnotte() {
  await getSessionOuRediriger('/mobiliser/cagnottes/nouvelle');
  const supabase = await getSupabaseServer();
  const { data: estNational } = await supabase.rpc('est_admin_national');
  const peutCreerCotisation = estNational === true;

  return (
    <Container taille="md" className="py-12">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">
          <Link href="/mobiliser/cagnottes" className="hover:text-brand">
            ← Toutes les cagnottes
          </Link>
        </p>
        <Heading niveau={1} className="mt-1">
          Créer une cagnotte
        </Heading>
        <p className="mt-3 max-w-2xl text-text-2">
          Cagnotte ouverte ou caisse de lutte. Don en euros (frais 5 %, paiement Stripe sécurisé) ou
          en 99-coin (frais 0 %, via wallet). Modération a posteriori : ta cagnotte est en ligne
          immédiatement, suspendable par l'équipe en cas de problème.
        </p>
      </header>

      <FormulaireCreationCagnotte
        creerCagnotte={creerCagnotte}
        peutCreerCotisation={peutCreerCotisation}
      />
    </Container>
  );
}
