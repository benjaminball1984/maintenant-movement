import { Badge, Card, Container, Heading } from '@/components/ui';
import { federationParSlug } from '@/lib/communes/requetes';
import { metadataPourPartage } from '@/lib/og-metadata';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

const LIBELLE_TYPE: Record<string, string> = {
  geographique: 'Géographique',
  thematique: 'Thématique',
  mixte: 'Mixte',
};

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const federation = await federationParSlug(slug);
  if (federation === null) return { title: 'Fédération introuvable' };
  return metadataPourPartage({
    objet: {
      titre: federation.nom,
      description: `Fédération ${federation.nom} du mouvement Maintenant!`,
      image_url: null,
      type_objet: 'federation',
    },
    cheminPage: `/agir/federations/${slug}`,
  });
}

export default async function PageDetailFederation({ params }: PageDetailProps) {
  const { slug } = await params;
  const federation = await federationParSlug(slug);
  if (federation === null) notFound();

  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/agir/federations" className="hover:text-brand">
          ← Fédérations
        </Link>
      </p>
      <header className="grid gap-3">
        <Badge variant="brand">{LIBELLE_TYPE[federation.type] ?? federation.type}</Badge>
        <Heading niveau={1}>{federation.nom}</Heading>
        {federation.description_courte !== null && federation.description_courte.trim() !== '' ? (
          <p className="text-text-2">{federation.description_courte}</p>
        ) : null}
      </header>
      <Card variant="ombre" className="mt-6">
        <p className="text-sm text-text-2">
          <strong>{federation.nombre_communes}</strong> commune
          {federation.nombre_communes > 1 ? 's' : ''} rattachée
          {federation.nombre_communes > 1 ? 's' : ''}.
        </p>
      </Card>
    </Container>
  );
}
