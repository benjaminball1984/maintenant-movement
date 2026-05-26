import { Badge, Card, Container, Heading } from '@/components/ui';
import { listerGroupesEntraide } from '@/lib/groupe-entraide-local';
import { getImageObjet } from '@/lib/images';
import { metadataPourPartage } from '@/lib/og-metadata';
import { MapPin, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

/**
 * Page liste des groupes d'entraide locaux (cycle V2 V2.3.2).
 *
 * Sous-espace porte d'entrée non-politique : on met l'accent sur l'aspect
 * concret et bienveillant. Les groupes en modération ne sont pas affichés
 * (RLS filtre).
 */

export const metadata: Metadata = metadataPourPartage({
  objet: {
    titre: 'Groupes d’entraide locaux',
    description:
      'Trouve ou crée un groupe d’entraide près de chez toi : prêt d’objets, marché solidaire, hébergement, services, moments solidaires. Une porte d’entrée par l’entraide.',
    image_url: null,
    type_objet: 'generique',
  },
  cheminPage: '/s-entraider/groupes-locaux',
});

export default async function PageListeGroupesEntraide() {
  const groupes = await listerGroupesEntraide({ limite: 50 });

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Heading niveau={1}>Groupes d’entraide locaux</Heading>
          <p className="mt-2 max-w-2xl text-text-2">
            Quartier, immeuble, AMAP, voisinage : trouve un groupe près de chez toi, ou crée le
            tien. Prêt d’objets, marché solidaire, hébergement, covoiturage, services — tout ce
            qu’on partage entre voisin·es.
          </p>
        </div>
        <Link
          href="/s-entraider/groupes-locaux/nouveau"
          className="inline-flex h-11 items-center rounded-md bg-grad px-4 font-bold text-sm text-white shadow-brand transition hover:brightness-110"
        >
          Créer un groupe
        </Link>
      </header>

      {groupes.length === 0 ? (
        <Card variant="ombre">
          <p className="text-text-2">
            Aucun groupe publié pour le moment. Tu peux être la première personne à en créer un.
          </p>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {groupes.map((groupe) => {
            const image = getImageObjet({
              image_url: groupe.imageUrl,
              type_objet: 'generique',
            });
            return (
              <li key={groupe.id}>
                <Link
                  href={`/s-entraider/groupes-locaux/${groupe.slug}`}
                  className="group block overflow-hidden rounded-md border border-border bg-surface transition hover:shadow-md"
                >
                  <div className="relative aspect-video bg-surface-2">
                    <Image
                      src={image}
                      alt={groupe.nom}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-2 p-4">
                    <h2 className="font-display font-bold text-lg text-text-1 group-hover:text-brand">
                      {groupe.nom}
                    </h2>
                    <div className="flex items-center gap-2 text-text-3 text-xs">
                      <MapPin size={14} aria-hidden="true" />
                      <span>{groupe.zoneGeographique}</span>
                    </div>
                    <p className="line-clamp-3 text-sm text-text-2">{groupe.descriptionCourte}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {groupe.outilPretActive && <Badge variant="default">Prêt</Badge>}
                      {groupe.outilMarcheActive && <Badge variant="default">Marché</Badge>}
                      {groupe.outilSelActive && <Badge variant="default">SEL</Badge>}
                      {groupe.outilHebergementActive && (
                        <Badge variant="default">Hébergement</Badge>
                      )}
                      {groupe.outilMomentsActive && <Badge variant="default">Moments</Badge>}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-12 max-w-3xl border-border border-t pt-6 text-sm text-text-3">
        <Users size={14} className="-mt-0.5 mr-1 inline" aria-hidden="true" />
        Les groupes d’entraide locaux sont une <strong>porte d’entrée non-politique</strong> dans
        Maintenant! : on vient pour une perceuse, on s’entraide, on s’ouvre peut-être un jour à
        d’autres outils. Pas de pression militante.
      </p>
    </Container>
  );
}
