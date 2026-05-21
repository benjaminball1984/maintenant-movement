import { PageListeSousEspace } from '@/components/entraide/PageListeSousEspace';
import { SOUS_ESPACES } from '@/lib/entraide/config';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: SOUS_ESPACES.pret_objet.titre,
  description: SOUS_ESPACES.pret_objet.description,
};

export default function PageQuiPreteTout() {
  return <PageListeSousEspace type="pret_objet" />;
}
