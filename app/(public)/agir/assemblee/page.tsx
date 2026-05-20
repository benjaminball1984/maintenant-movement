import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { listerMandatsActifs } from '@/lib/communes/requetes';
import type { EntiteConfederal } from '@/types/database';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Assemblée Confédérale',
  description:
    'Composition de l’Assemblée Confédérale des Communes et Territoires Libres : binômes tirés au sort par entité, incompatibilité de cumul.',
};

interface PageAssembleeProps {
  searchParams: Promise<{ entite?: string }>;
}

const ONGLETS: Array<{ slug: 'toutes' | EntiteConfederal; libelle: string; href: string }> = [
  { slug: 'toutes', libelle: 'Toutes', href: '/agir/assemblee' },
  { slug: 'commune', libelle: 'Communes', href: '/agir/assemblee?entite=commune' },
  { slug: 'federation', libelle: 'Fédérations', href: '/agir/assemblee?entite=federation' },
  {
    slug: 'confederation',
    libelle: 'Confédérations',
    href: '/agir/assemblee?entite=confederation',
  },
];

function estEntiteValide(v: string | undefined): v is EntiteConfederal {
  return v === 'commune' || v === 'federation' || v === 'confederation';
}

const LIBELLE_TYPE: Record<EntiteConfederal, string> = {
  commune: 'Commune',
  federation: 'Fédération',
  confederation: 'Confédération',
};

const FORMATEUR_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export default async function PageAssemblee({ searchParams }: PageAssembleeProps) {
  const { entite } = await searchParams;
  const filtre = estEntiteValide(entite) ? entite : undefined;
  const mandats = await listerMandatsActifs(filtre);

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">Agir</p>
        <Heading niveau={1}>Assemblée Confédérale des Communes et Territoires Libres</Heading>
        <p className="mt-3 max-w-2xl text-text-2">
          Binômes tirés au sort par entité (commune, fédération, confédération). Incompatibilité de
          cumul : un mandat à un niveau supérieur libère automatiquement les mandats inférieurs.
        </p>
      </header>

      <nav
        aria-label="Filtrer par entité"
        className="mb-8 flex flex-wrap gap-2 border-b border-border"
      >
        {ONGLETS.map((onglet) => {
          const actif = (filtre ?? 'toutes') === onglet.slug;
          return (
            <Link
              key={onglet.slug}
              href={onglet.href}
              className={
                actif
                  ? 'border-b-2 border-brand px-3 py-2 text-sm text-brand'
                  : 'border-b-2 border-transparent px-3 py-2 text-sm text-text-3 hover:text-text-1'
              }
            >
              {onglet.libelle}
            </Link>
          );
        })}
      </nav>

      {mandats.length === 0 ? (
        <Alert variant="info" titre="Aucun mandat actif pour ce filtre">
          Le tirage au sort est déclenché par l'admin national depuis la console d'administration.
          Tant qu'aucun tirage n'a eu lieu, cette liste reste vide.
        </Alert>
      ) : (
        <ul className="grid gap-3">
          {mandats.map((m) => (
            <li key={m.id}>
              <Card variant="ombre" className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge variant="brand">{LIBELLE_TYPE[m.entite_type]}</Badge>
                  <p className="mt-1 font-bold text-text-1">
                    {[m.personne_prenom, m.personne_nom]
                      .filter((s) => s !== null && s.trim() !== '')
                      .join(' ') || 'Personne tirée au sort'}
                  </p>
                </div>
                <p className="text-xs text-text-3">
                  Tirée le {FORMATEUR_DATE.format(new Date(m.tire_le))}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
