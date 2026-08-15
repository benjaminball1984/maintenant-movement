import { confirmerDonEuros } from '@/app/(public)/mobiliser/cagnottes/actions';
import { Alert, Container, Heading } from '@/components/ui';
import { centimesEnCoins } from '@/lib/conversion-99coin';
import { formaterEurosDepuisCentimes } from '@/lib/format-euros';
import { getSupabaseServer } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Link from 'next/link';

const FORMATEUR_COINS = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 2,
});

export const metadata: Metadata = {
  title: 'Merci pour ton don',
};

interface PageRetourProps {
  searchParams: Promise<{ session_id?: string; don_id?: string }>;
}

/**
 * Page de retour après Stripe Checkout (mock ou réel).
 *
 * Reçoit `session_id` (Stripe ou mock) et `don_id` (UUID de la ligne
 * pré-insérée). Appelle `confirmerDonEuros` côté serveur pour passer le
 * don en `confirme` puis affiche un récap.
 *
 * En prod, c'est aussi le webhook `checkout.session.completed` qui
 * confirmera (idempotent grâce à `.eq('statut', 'en_attente')`).
 */
export default async function PageRetour({ searchParams }: PageRetourProps) {
  const { session_id, don_id } = await searchParams;

  if (session_id === undefined || session_id === '' || don_id === undefined || don_id === '') {
    return (
      <Container taille="sm" className="py-12">
        <Heading niveau={1}>Lien incomplet</Heading>
        <Alert
          variant="warning"
          titre="Cette page de retour attend un paiement valide"
          className="my-6"
        >
          Le lien semble incomplet (paramètres de session manquants). Si tu venais de faire un don,
          reviens sur la cagnotte concernée pour vérifier qu'il a bien été enregistré.
        </Alert>
        <Link href="/mobiliser/cagnottes" className="text-brand hover:underline">
          Retour à la liste des cagnottes
        </Link>
      </Container>
    );
  }

  const resultat = await confirmerDonEuros(session_id, don_id);

  // Récupère le slug de la cagnotte (pour le retour) et le montant (pour le récap).
  let slugCagnotte: string | null = null;
  let montantCentimes: number | null = null;
  if (resultat.ok) {
    const supabase = await getSupabaseServer();
    const { data: don } = await supabase
      .from('don')
      .select('cagnotte_id, montant_centimes')
      .eq('id', don_id)
      .maybeSingle();
    if (don !== null) {
      montantCentimes = don.montant_centimes;
      const { data: c } = await supabase
        .from('cagnotte')
        .select('slug')
        .eq('id', don.cagnotte_id)
        .maybeSingle();
      slugCagnotte = c?.slug ?? null;
    }
  }

  // Récap du montant dans les deux monnaies (parité 1 € = 1 99-coin = 1 minute).
  const recapMontant =
    montantCentimes !== null && montantCentimes > 0
      ? `Ton don de ${formaterEurosDepuisCentimes(montantCentimes)} (soit ${FORMATEUR_COINS.format(
          centimesEnCoins(montantCentimes),
        )} 99-coin) a bien été enregistré et abonde la cagnotte.`
      : 'Ton paiement a bien été enregistré et abonde la cagnotte.';

  return (
    <Container taille="sm" className="py-12">
      {resultat.ok ? (
        <>
          <Heading niveau={1}>Merci pour ton don</Heading>
          <Alert variant="success" titre="Don confirmé" className="my-6">
            {recapMontant}
          </Alert>
          {/* Proposition d'adhésion après un don (décision Lilou/Ben du
              01/08/2026, même logique qu'après une signature) : la
              personne vient de poser un geste, c'est le moment où l'on
              peut lui proposer d'entrer dans le mouvement. Un seul appel,
              sans concurrence avec le partage. */}
          <section className="my-8 grid gap-3 rounded-md border border-border bg-surface-2 p-6">
            <Heading niveau={2} apparenceComme={4}>
              Aller plus loin
            </Heading>
            <p className="text-sm text-text-2">
              Tu viens de soutenir un combat. Tu peux aussi adhérer au mouvement — gratuitement, ou
              en le soutenant.
            </p>
            <Link
              href="/agir/adherer"
              className={cn(
                'inline-flex h-11 w-fit items-center justify-center rounded-md bg-grad px-5',
                'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
              )}
            >
              Adhérer au mouvement
            </Link>
          </section>

          {slugCagnotte !== null ? (
            <Link
              href={`/mobiliser/cagnottes/${slugCagnotte}?succes=1`}
              className="text-brand hover:underline"
            >
              Retour à la cagnotte
            </Link>
          ) : (
            <Link href="/mobiliser/cagnottes" className="text-brand hover:underline">
              Voir toutes les cagnottes
            </Link>
          )}
        </>
      ) : (
        <>
          <Heading niveau={1}>Confirmation impossible</Heading>
          <Alert variant="danger" titre="Erreur" className="my-6">
            {resultat.message}
          </Alert>
          <Link href="/mobiliser/cagnottes" className="text-brand hover:underline">
            Retour à la liste des cagnottes
          </Link>
        </>
      )}
    </Container>
  );
}
