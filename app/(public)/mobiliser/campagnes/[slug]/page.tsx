import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { type ModuleResolu, campagneParSlug } from '@/lib/campagnes/requetes';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

const LIBELLE_TYPE_MODULE: Record<string, string> = {
  petition: 'Pétition',
  mobilisation: 'Mobilisation',
  cagnotte: 'Cagnotte',
  sondage: 'Sondage',
  page_editoriale: 'Page éditoriale',
};

const ROUTE_TYPE_MODULE: Record<string, (slug: string) => string> = {
  petition: (slug) => `/mobiliser/petitions/${slug}`,
  mobilisation: (slug) => `/mobiliser/mobilisations/${slug}`,
  cagnotte: (slug) => `/mobiliser/cagnottes/${slug}`,
  sondage: (slug) => `/decider/sondages/${slug}`,
};

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const campagne = await campagneParSlug(slug);
  if (campagne === null) {
    return { title: 'Campagne introuvable' };
  }
  return {
    title: campagne.titre,
    description: campagne.texte.slice(0, 160),
  };
}

/**
 * Fiche détail d'une campagne avec ses modules.
 *
 * Pour chaque module, on rend une carte cliquable vers la cible
 * (pétition, mobilisation, ...) ou le texte intégral pour les pages
 * éditoriales. Les modules d'un type pas encore implémenté (cagnotte,
 * sondage) s'affichent avec un état « bientôt disponible ».
 */
export default async function PageCampagneDetail({ params }: PageDetailProps) {
  const { slug } = await params;
  const campagne = await campagneParSlug(slug);

  if (campagne === null) {
    notFound();
  }

  const estPubliee = campagne.statut === 'publiee';

  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/mobiliser/campagnes" className="hover:text-brand">
          ← Toutes les campagnes
        </Link>
      </p>

      <article className="grid gap-8">
        <header className="grid gap-4">
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">Campagne</p>
          <Heading niveau={1}>{campagne.titre}</Heading>

          {campagne.image_url !== null ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border">
              <Image
                src={campagne.image_url}
                alt=""
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 720px"
                className="object-cover"
              />
            </div>
          ) : null}
        </header>

        {!estPubliee ? (
          <Alert
            variant={campagne.statut === 'rejetee' ? 'danger' : 'warning'}
            titre={
              campagne.statut === 'en_moderation'
                ? 'En attente de modération'
                : campagne.statut === 'rejetee'
                  ? 'Campagne rejetée'
                  : 'Campagne archivée'
            }
          >
            {campagne.statut === 'en_moderation' ? (
              <>L'équipe Maintenant! examine ta campagne. Délai habituel : 24 à 48 heures.</>
            ) : campagne.statut === 'rejetee' ? (
              <>
                Raison : {campagne.raison_rejet ?? 'non précisée'}. Tu peux soumettre une nouvelle
                version.
              </>
            ) : (
              <>Cette campagne est archivée.</>
            )}
          </Alert>
        ) : null}

        <section className="grid gap-4">
          <Heading niveau={2} apparenceComme={3}>
            Présentation
          </Heading>
          <div className="grid gap-4 whitespace-pre-line text-text-2 leading-relaxed">
            {campagne.texte}
          </div>
        </section>

        {campagne.modules.length > 0 ? (
          <section className="grid gap-4">
            <Heading niveau={2} apparenceComme={3}>
              Modules de la campagne
            </Heading>
            <ul className="grid gap-3">
              {campagne.modules.map((module) => (
                <li key={module.id}>
                  <RenduModule module={module} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <footer className="border-t border-border pt-4 text-sm text-text-3">
          {campagne.createurice_prenom !== null || campagne.createurice_nom !== null ? (
            <p>
              Lancée par{' '}
              <strong className="text-text-2">
                {[campagne.createurice_prenom, campagne.createurice_nom]
                  .filter((s) => s !== null && s.trim() !== '')
                  .join(' ')}
              </strong>
              .
            </p>
          ) : null}
        </footer>
      </article>
    </Container>
  );
}

function RenduModule({ module }: { module: ModuleResolu }) {
  if (module.type_module === 'page_editoriale') {
    return (
      <Card variant="ombre" className="grid gap-2">
        <Badge variant="default">{LIBELLE_TYPE_MODULE.page_editoriale}</Badge>
        <div className="whitespace-pre-line text-sm text-text-2 leading-relaxed">
          {module.contenu_editorial}
        </div>
      </Card>
    );
  }

  const route = ROUTE_TYPE_MODULE[module.type_module];
  const cibleIndisponible = module.titre_cible === null;

  return (
    <Card variant="ombre" className="flex flex-col gap-2">
      <Badge variant="default">
        {LIBELLE_TYPE_MODULE[module.type_module] ?? module.type_module}
      </Badge>
      {cibleIndisponible ? (
        <p className="text-sm text-text-3">
          La cible de ce module n'est pas (encore) disponible publiquement (cf. chantiers 3.3 et 7.5
          pour les cagnottes et sondages).
        </p>
      ) : (
        <h4 className="text-base font-bold text-text-1">
          {route !== undefined && module.slug_cible !== null ? (
            <Link href={route(module.slug_cible)} className="underline-offset-4 hover:underline">
              {module.titre_cible} →
            </Link>
          ) : (
            module.titre_cible
          )}
        </h4>
      )}
    </Card>
  );
}
