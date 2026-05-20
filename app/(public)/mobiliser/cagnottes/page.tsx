import { PageSousEspaceStub } from '@/components/home/PageSousEspaceStub';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cagnottes',
};

export default function PageCagnottes() {
  return (
    <PageSousEspaceStub
      espaceParent={{ slug: 'mobiliser', libelle: 'Mobiliser' }}
      titre="Cagnottes solidaires"
      chantier="chantier 3.3"
      description="3 sous-types (ouvertes, lutte, cotisations), Stripe Checkout + Stripe Connect KYC, dons T99CP, frais 5 % en euros / 0 % en T99CP. Implémentation au chantier 3.3."
    />
  );
}
