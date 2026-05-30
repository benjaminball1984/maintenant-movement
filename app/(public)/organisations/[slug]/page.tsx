import { BoutonSuivreEspace } from '@/components/reseau/BoutonSuivreEspace';
import { FilEspacePublic } from '@/components/reseau/FilEspacePublic';
import { Badge, Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { metadataPourPartage } from '@/lib/og-metadata';
import { organisationParSlug } from '@/lib/organisations/requetes';
import { LIBELLE_TYPE_ORGANISATION, type TypeOrganisation } from '@/lib/organisations/validation';
import { jeSuisCetEspace } from '@/lib/reseau/abonnement';
import { BadgeCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const organisation = await organisationParSlug(slug);
  if (organisation === null) return { title: 'Organisation introuvable' };
  return metadataPourPartage({
    objet: {
      titre: organisation.nom,
      description:
        organisation.description ??
        `${LIBELLE_TYPE_ORGANISATION[organisation.typeOrganisation]} sur Maintenant!`,
      image_url: organisation.imageUrl,
      type_objet: 'generique',
    },
    cheminPage: `/organisations/${slug}`,
  });
}

/**
 * Page détail d'une organisation (épopée réseau V2, chantier B.1).
 *
 * Réutilise le mécanisme « espace » : bouton « Suivre dans le réseau » et fil
 * des publications faites au nom de l'organisation. Le badge « officiel »
 * (certification anti-usurpation) s'affiche s'il a été accordé par l'admin.
 */
export default async function PageDetailOrganisation({ params }: PageDetailProps) {
  const { slug } = await params;
  const organisation = await organisationParSlug(slug);
  if (organisation === null) notFound();

  const session = await getSession();
  const typeLabel =
    LIBELLE_TYPE_ORGANISATION[organisation.typeOrganisation as TypeOrganisation] ??
    organisation.typeOrganisation;

  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/organisations" className="hover:text-brand">
          ← Toutes les organisations
        </Link>
      </p>

      <article className="grid gap-6">
        <header className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand">{typeLabel}</Badge>
            {organisation.badgeOfficiel ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2 py-0.5 font-bold text-brand text-xs">
                <BadgeCheck size={14} strokeWidth={2} aria-hidden="true" />
                Officielle
              </span>
            ) : (
              <span className="text-text-3 text-xs">Page non encore officialisée</span>
            )}
          </div>
          <Heading niveau={1}>{organisation.nom}</Heading>

          {organisation.imageUrl !== null ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border">
              <Image
                src={organisation.imageUrl}
                alt=""
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 720px"
                className="object-cover"
              />
            </div>
          ) : null}

          {organisation.description !== null && organisation.description.trim() !== '' ? (
            <p className="whitespace-pre-wrap text-text-2">{organisation.description}</p>
          ) : null}

          {session !== null ? (
            <BoutonSuivreEspace
              espaceType="organisation"
              espaceId={organisation.id}
              espaceNom={organisation.nom}
              jeSuisInitial={await jeSuisCetEspace('organisation', organisation.id)}
              cheminRevalidation={`/organisations/${slug}`}
            />
          ) : null}
        </header>

        {/* Fil des publications faites au nom de l'organisation. */}
        <FilEspacePublic
          espaceType="organisation"
          espaceId={organisation.id}
          titre={`Publications de ${organisation.nom}`}
        />
      </article>
    </Container>
  );
}
