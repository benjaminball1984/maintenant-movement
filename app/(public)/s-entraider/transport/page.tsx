import { PageListeSousEspace } from '@/components/entraide/PageListeSousEspace';
import { SOUS_ESPACES } from '@/lib/entraide/config';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: SOUS_ESPACES.transport.titre,
  description: SOUS_ESPACES.transport.description,
};

export default function PageTransport() {
  return <PageListeSousEspace type="transport" />;
}
