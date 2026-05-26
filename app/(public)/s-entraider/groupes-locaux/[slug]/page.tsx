import { FilDeGroupe } from '@/components/fil-groupe/FilDeGroupe';
import { Badge, Card, Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import {
  estMembreDuGroupe,
  groupeEntraideParSlug,
  listerMembresGroupe,
} from '@/lib/groupe-entraide-local';
import { getImageObjet } from '@/lib/images';
import { metadataPourPartage } from '@/lib/og-metadata';
import { MapPin, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BoutonsAdhesion } from './BoutonsAdhesion';

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const groupe = await groupeEntraideParSlug(slug);
  if (groupe === null) return { title: 'Groupe introuvable' };
  return metadataPourPartage({
    objet: {
      titre: groupe.nom,
      description: groupe.descriptionCourte,
      image_url: groupe.imageUrl,
      type_objet: 'generique',
    },
    cheminPage: `/s-entraider/groupes-locaux/${slug}`,
  });
}

/**
 * Page détail d'un groupe d'entraide local (cycle V2 V2.3.2).
 *
 * Sections :
 * 1. En-tête : image, nom, zone, description, badges des outils activés.
 * 2. Boutons « Rejoindre / Quitter » selon l'état d'appartenance.
 * 3. Fil de discussion du groupe (composant `FilDeGroupe` de V2.2.1).
 *    Visible uniquement par les membres (RLS de `fil_groupe_message` +
 *    `est_membre_espace('groupe_entraide_local', ...)` mis à jour en
 *    V2.3.2 pour lire la vraie table d'appartenance).
 */
export default async function PageDetailGroupeEntraide({ params }: PageDetailProps) {
  const { slug } = await params;
  const groupe = await groupeEntraideParSlug(slug);
  if (groupe === null) notFound();

  const session = await getSession();
  const estMembre = session !== null ? await estMembreDuGroupe(groupe.id, session.userId) : false;
  const membres = estMembre ? await listerMembresGroupe(groupe.id) : [];

  const image = getImageObjet({ image_url: groupe.imageUrl, type_objet: 'generique' });

  return (
    <Container taille="lg" className="py-12">
      <Link
        href="/s-entraider/groupes-locaux"
        className="mb-4 inline-flex text-sm text-text-3 hover:text-brand"
      >
        ← Tous les groupes
      </Link>

      <header className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="relative aspect-video overflow-hidden rounded-md bg-surface-2">
          <Image
            src={image}
            alt={groupe.nom}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 66vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col gap-3">
          {groupe.statut === 'en_moderation' && <Badge variant="warning">En modération</Badge>}
          <Heading niveau={1}>{groupe.nom}</Heading>
          <div className="flex items-center gap-2 text-sm text-text-3">
            <MapPin size={16} aria-hidden="true" />
            <span>{groupe.zoneGeographique}</span>
          </div>
          <BoutonsAdhesion
            groupeId={groupe.id}
            estMembre={estMembre}
            estConnecte={session !== null}
          />
        </div>
      </header>

      <section className="mt-8 grid gap-8 md:grid-cols-[2fr_1fr]">
        <div>
          <Heading niveau={2}>Le groupe</Heading>
          <p className="mt-2 whitespace-pre-wrap text-text-2">{groupe.description}</p>

          <Heading niveau={2} className="mt-8">
            Outils activés
          </Heading>
          <div className="mt-3 flex flex-wrap gap-2">
            {groupe.outilPretActive && <Badge variant="default">Prêt d’objets</Badge>}
            {groupe.outilMarcheActive && <Badge variant="default">Marché solidaire</Badge>}
            {groupe.outilSelActive && <Badge variant="default">SEL</Badge>}
            {groupe.outilFruitsActive && <Badge variant="default">Fruits de la terre</Badge>}
            {groupe.outilHebergementActive && <Badge variant="default">Hébergement</Badge>}
            {groupe.outilTransportActive && <Badge variant="default">Covoiturage</Badge>}
            {groupe.outilMomentsActive && <Badge variant="default">Moments solidaires</Badge>}
            {groupe.outilMobilisationsActive && <Badge variant="default">Mobilisations</Badge>}
          </div>
          <p className="mt-2 text-text-3 text-xs">
            Outils politiques (pétitions, Décider) désactivés par défaut. Le groupe peut les activer
            plus tard s’il en exprime le besoin.
          </p>
        </div>

        <aside className="flex flex-col gap-4">
          <Card variant="ombre">
            <h3 className="flex items-center gap-2 font-bold text-text-1">
              <Users size={16} aria-hidden="true" />
              Membres
            </h3>
            {estMembre ? (
              <p className="mt-2 text-sm text-text-2">
                {membres.length} membre{membres.length > 1 ? 's' : ''} actif
                {membres.length > 1 ? 's' : ''}.
              </p>
            ) : (
              <p className="mt-2 text-sm text-text-3">
                Rejoins le groupe pour voir les co-membres.
              </p>
            )}
          </Card>
        </aside>
      </section>

      {estMembre && (
        <section className="mt-10">
          <FilDeGroupe
            espaceType="groupe_entraide_local"
            espaceId={groupe.id}
            cheminRevalidation={`/s-entraider/groupes-locaux/${groupe.slug}`}
          />
        </section>
      )}
    </Container>
  );
}
