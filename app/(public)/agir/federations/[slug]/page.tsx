import { FilDeGroupe } from '@/components/fil-groupe/FilDeGroupe';
import { Badge, Card, Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
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

  // Note V2.3.8 : la table `appartenance_federation` lie une COMMUNE à une
  // fédération, pas une personne. Une personne est « membre » d'une
  // fédération si elle est membre d'au moins une commune rattachée. Le
  // helper SQL `est_membre_espace('federation', ...)` posé en V2.2.1
  // lisait directement `appartenance_federation.personne_id` — qui
  // n'existe pas. À corriger dans un chantier dédié avec migration. En
  // attendant, on affiche le fil aux comptes authentifiés (la RLS sera
  // toujours plus restrictive que l'UI une fois le helper corrigé).
  const session = await getSession();

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

      {/* Fil de discussion de la fédération (cycle V2 §18, V2.2.1 + V2.3.8).
          Visible aux comptes authentifiés en attendant le helper SQL corrigé. */}
      {session !== null ? (
        <section className="mt-8">
          <FilDeGroupe
            espaceType="federation"
            espaceId={federation.id}
            cheminRevalidation={`/agir/federations/${slug}`}
          />
        </section>
      ) : null}
    </Container>
  );
}
