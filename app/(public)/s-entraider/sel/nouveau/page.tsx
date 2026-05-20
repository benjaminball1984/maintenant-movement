import { creerServiceSel } from '@/app/(public)/s-entraider/sel/actions';
import { FormulaireCreationService } from '@/components/sel/FormulaireCreationService';
import { Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Publier un service SEL' };

export default async function PageNouveauService() {
  await getSessionOuRediriger('/s-entraider/sel/nouveau');
  return (
    <>
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/s-entraider/sel" className="hover:text-brand">
          ← SEL
        </Link>
      </p>
      <Heading niveau={1}>Publier un service SEL</Heading>
      <p className="mt-3 max-w-2xl text-text-2">
        Service entre particulier·ères ou volontariat pour un collectif. 1 minute = 1 99-coin
        crédité après réalisation (modération 2 h).
      </p>
      <div className="mt-8">
        <FormulaireCreationService creerServiceSel={creerServiceSel} />
      </div>
    </>
  );
}
