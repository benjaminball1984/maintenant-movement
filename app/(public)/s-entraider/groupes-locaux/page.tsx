import { MarkdownLeger } from '@/components/contenu/MarkdownLeger';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Badge, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { listerGroupesEntraide } from '@/lib/groupe-entraide-local';
import { getImageObjet } from '@/lib/images';
import { metadataPourPartage } from '@/lib/og-metadata';
import { MapPin, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

const FALLBACKS = {
  intro:
    'Quartier, immeuble, AMAP, voisinage : trouve un groupe près de chez toi, ou crée le tien. Prêt d’objets, marché solidaire, hébergement, covoiturage, services — tout ce qu’on partage entre voisin·es.',
  ctaCreer: 'Créer un groupe',
  empty: 'Aucun groupe publié pour le moment. Tu peux être la première personne à en créer un.',
  porteEntreeNote:
    'Les groupes d’entraide locaux sont une **porte d’entrée non-politique** dans Maintenant! : on vient pour une perceuse, on s’entraide, on s’ouvre peut-être un jour à d’autres outils. Pas de pression militante.',
};

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
  const [groupes, estAdmin, intro, ctaCreer, empty, porteEntreeNote] = await Promise.all([
    listerGroupesEntraide({ limite: 50 }),
    estAdminCourant(),
    lireContenuEditorial('s-entraider.groupes_locaux.intro', { valeurMd: FALLBACKS.intro }),
    lireContenuEditorial('s-entraider.groupes_locaux.cta_creer', { valeurMd: FALLBACKS.ctaCreer }),
    lireContenuEditorial('s-entraider.groupes_locaux.empty', { valeurMd: FALLBACKS.empty }),
    lireContenuEditorial('s-entraider.groupes_locaux.porte_entree_note', {
      valeurMd: FALLBACKS.porteEntreeNote,
    }),
  ]);

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Heading niveau={1}>Groupes d’entraide locaux</Heading>
          <TexteEditableAdmin
            cle="s-entraider.groupes_locaux.intro"
            valeurInitiale={intro.valeurMd}
            estAdmin={estAdmin}
            libelle="intro page groupes entraide locaux"
            multilignes
            longueurMax={500}
          >
            {(t) => <p className="mt-2 max-w-2xl text-text-2">{t}</p>}
          </TexteEditableAdmin>
        </div>
        <TexteEditableAdmin
          cle="s-entraider.groupes_locaux.cta_creer"
          valeurInitiale={ctaCreer.valeurMd}
          estAdmin={estAdmin}
          libelle="CTA Creer un groupe"
          longueurMax={50}
        >
          {(t) => (
            <Link
              href="/s-entraider/groupes-locaux/nouveau"
              className="inline-flex h-11 items-center rounded-md bg-grad px-4 font-bold text-sm text-white shadow-brand transition hover:brightness-110"
            >
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </header>

      {groupes.length === 0 ? (
        <Card variant="ombre">
          <TexteEditableAdmin
            cle="s-entraider.groupes_locaux.empty"
            valeurInitiale={empty.valeurMd}
            estAdmin={estAdmin}
            libelle="empty state groupes locaux"
            multilignes
            longueurMax={300}
          >
            {(t) => <p className="text-text-2">{t}</p>}
          </TexteEditableAdmin>
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

      <div className="mt-12 max-w-3xl border-border border-t pt-6 text-sm text-text-3">
        <Users size={14} className="-mt-0.5 mr-1 inline" aria-hidden="true" />
        <TexteEditableAdmin
          cle="s-entraider.groupes_locaux.porte_entree_note"
          valeurInitiale={porteEntreeNote.valeurMd}
          estAdmin={estAdmin}
          libelle="note porte d'entree (Markdown leger : **gras**)"
          multilignes
          longueurMax={400}
        >
          {(t) => (
            <span className="inline">
              <MarkdownLeger texte={t} />
            </span>
          )}
        </TexteEditableAdmin>
      </div>
    </Container>
  );
}
