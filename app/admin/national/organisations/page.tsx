import { Container, Heading } from '@/components/ui';
import { listerOrganisations } from '@/lib/organisations/requetes';
import { listerRevendicationsEnAttente } from '@/lib/organisations/revendications';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ConsoleOrganisationsAdmin } from './ConsoleOrganisationsAdmin';

export const metadata: Metadata = { title: 'Organisations — Admin' };

/**
 * Console admin des organisations (épopée réseau V2, chantier B.3).
 *
 * L'accès admin est garanti par `app/admin/layout.tsx`. On y arbitre les
 * revendications de gestion concurrentes et on accorde le badge officiel.
 */
export default async function PageAdminOrganisations() {
  const [revendications, organisations] = await Promise.all([
    listerRevendicationsEnAttente(),
    listerOrganisations(),
  ]);

  return (
    <Container taille="lg" className="py-8">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/admin/national" className="hover:text-brand">
          ← Admin national
        </Link>
      </p>
      <Heading niveau={1} className="mb-2">
        Organisations
      </Heading>
      <p className="mb-6 text-text-2">
        Arbitre les revendications de gestion (accepter rend la personne gestionnaire) et accorde le
        badge « officiel » (voie 2 : l’admin accorde le premier, puis les gestionnaires cooptent).
      </p>
      <ConsoleOrganisationsAdmin revendications={revendications} organisations={organisations} />
    </Container>
  );
}
