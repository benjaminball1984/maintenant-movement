import { PageListeSousEspace } from '@/components/entraide/PageListeSousEspace';
import { SOUS_ESPACES } from '@/lib/entraide/config';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: SOUS_ESPACES.fruits_terre.titre,
  description: SOUS_ESPACES.fruits_terre.description,
};

export default function PageFruitsTerre() {
  return <PageListeSousEspace type="fruits_terre" />;
}
