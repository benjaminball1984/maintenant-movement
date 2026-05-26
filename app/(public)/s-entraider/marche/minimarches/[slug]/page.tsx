import { BadgesMonnaies } from '@/components/marche/BadgesMonnaies';
import { Badge, Card, Heading } from '@/components/ui';
import { minimarcheParSlug } from '@/lib/marche/requetes';
import { metadataPourPartage } from '@/lib/og-metadata';
import { CalendarRange, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

const FORMATEUR = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const minimarche = await minimarcheParSlug(slug);
  if (minimarche === null) return { title: 'Minimarché introuvable' };
  return metadataPourPartage({
    objet: {
      titre: minimarche.titre,
      description: minimarche.description,
      image_url: minimarche.image_url,
      type_objet: 'minimarche_solidaire',
    },
    cheminPage: `/s-entraider/marche/minimarches/${slug}`,
  });
}

export default async function PageDetailMinimarche({ params }: PageDetailProps) {
  const { slug } = await params;
  const minimarche = await minimarcheParSlug(slug);
  if (minimarche === null) notFound();

  return (
    <>
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/s-entraider/marche/minimarches" className="hover:text-brand">
          ← Minimarchés
        </Link>
      </p>

      <article className="grid gap-6">
        <header className="grid gap-3">
          <div className="flex items-center gap-2">
            <Badge variant={minimarche.statut === 'en_cours' ? 'success' : 'brand'}>
              {minimarche.statut === 'en_cours'
                ? 'En cours'
                : minimarche.statut === 'annonce'
                  ? 'Annoncé'
                  : minimarche.statut === 'termine'
                    ? 'Terminé'
                    : 'Annulé'}
            </Badge>
          </div>
          <Heading niveau={1}>{minimarche.titre}</Heading>
        </header>

        <Card variant="ombre" className="grid gap-3">
          <div className="flex items-start gap-3">
            <CalendarRange size={18} strokeWidth={1.5} className="mt-0.5 text-text-3" />
            <div>
              <p className="text-xs font-bold uppercase tracking-cap text-text-3">Dates</p>
              <p className="text-text-1">
                Du {FORMATEUR.format(new Date(minimarche.commence_le))}
                <br />
                au {FORMATEUR.format(new Date(minimarche.termine_le))}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin size={18} strokeWidth={1.5} className="mt-0.5 text-text-3" />
            <div>
              <p className="text-xs font-bold uppercase tracking-cap text-text-3">Lieu</p>
              <p className="text-text-1">{minimarche.lieu}</p>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
              Monnaies acceptées
            </p>
            <BadgesMonnaies monnaies={minimarche.monnaies_acceptees} />
          </div>
        </Card>

        <section className="grid gap-3">
          <Heading niveau={2} apparenceComme={3}>
            Description et conseils d'organisation
          </Heading>
          <div className="grid gap-4 whitespace-pre-line text-text-2 leading-relaxed">
            {minimarche.description}
          </div>
        </section>

        <footer className="border-t border-border pt-4 text-sm text-text-3">
          {minimarche.createurice_prenom !== null || minimarche.createurice_nom !== null ? (
            <p>
              Organisé par{' '}
              <strong className="text-text-2">
                {[minimarche.createurice_prenom, minimarche.createurice_nom]
                  .filter((s) => s !== null && s.trim() !== '')
                  .join(' ')}
              </strong>
              .
            </p>
          ) : null}
        </footer>
      </article>
    </>
  );
}
