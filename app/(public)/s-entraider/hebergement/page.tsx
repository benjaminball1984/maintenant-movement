import { PageListeSousEspace } from '@/components/entraide/PageListeSousEspace';
import { SOUS_ESPACES } from '@/lib/entraide/config';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: SOUS_ESPACES.hebergement.titre,
  description: SOUS_ESPACES.hebergement.description,
};

export default function PageHebergement() {
  return <PageListeSousEspace type="hebergement" />;
}
