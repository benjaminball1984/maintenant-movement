import { CarteProduit } from '@/components/marche/CarteProduit';
import { Alert, Badge, Heading } from '@/components/ui';
import { boutiqueParSlug, produitsDeLaBoutique } from '@/lib/marche/requetes';
import { CalendarRange, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

const FORMATEUR_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const boutique = await boutiqueParSlug(slug);
  if (boutique === null) return { title: 'Boutique introuvable' };
  return { title: boutique.nom, description: boutique.description.slice(0, 160) };
}

export default async function PageDetailBoutique({ params }: PageDetailProps) {
  const { slug } = await params;
  const boutique = await boutiqueParSlug(slug);
  if (boutique === null) notFound();

  const produits = await produitsDeLaBoutique(boutique.id);

  return (
    <>
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/s-entraider/marche/boutiques" className="hover:text-brand">
          ← Boutiques
        </Link>
      </p>

      <article className="grid gap-6">
        <header className="grid gap-3">
          <div className="flex items-center gap-2">
            <Badge variant={boutique.sens === 'propose' ? 'brand' : 'info'}>
              {boutique.sens === 'propose' ? 'Boutique' : 'Cherche à co-créer'}
            </Badge>
            {boutique.statut !== 'ouverte' ? (
              <Badge variant="default">{boutique.statut === 'fermee' ? 'Fermée' : 'Retirée'}</Badge>
            ) : null}
          </div>
          <Heading niveau={1}>{boutique.nom}</Heading>
          <p className="text-text-2">{boutique.description}</p>
        </header>

        <dl className="grid gap-2 text-sm text-text-2 sm:grid-cols-2">
          {boutique.lieu !== null && boutique.lieu.trim() !== '' ? (
            <div className="flex items-start gap-2">
              <MapPin size={16} strokeWidth={1.5} className="mt-0.5 text-text-3" />
              <dd>{boutique.lieu}</dd>
            </div>
          ) : null}
          {boutique.ouverte_du !== null ? (
            <div className="flex items-start gap-2">
              <CalendarRange size={16} strokeWidth={1.5} className="mt-0.5 text-text-3" />
              <dd>
                {FORMATEUR_DATE.format(new Date(boutique.ouverte_du))}
                {boutique.ouverte_au !== null
                  ? ` → ${FORMATEUR_DATE.format(new Date(boutique.ouverte_au))}`
                  : ''}
              </dd>
            </div>
          ) : null}
        </dl>

        <section className="grid gap-3">
          <Heading niveau={2} apparenceComme={3}>
            Produits rattachés ({produits.length})
          </Heading>
          {produits.length === 0 ? (
            <Alert variant="info" titre="Pas encore de produit rattaché">
              La créatrice n'a pas encore rattaché de produit à cette boutique. Les rattachements
              s'ajoutent depuis la fiche produit (chantier polish).
            </Alert>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {produits.map((produit) => (
                <li key={produit.id}>
                  <CarteProduit produit={produit} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="border-t border-border pt-4 text-sm text-text-3">
          {boutique.createurice_prenom !== null || boutique.createurice_nom !== null ? (
            <p>
              Créée par{' '}
              <strong className="text-text-2">
                {[boutique.createurice_prenom, boutique.createurice_nom]
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
