import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import {
  getCommuneLibreParInsee,
  getCommuneReference,
  getCompteursCommune,
} from '@/lib/communes/reference';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageFicheCommuneProps {
  params: Promise<{ code_insee: string }>;
}

export async function generateMetadata({ params }: PageFicheCommuneProps): Promise<Metadata> {
  const { code_insee } = await params;
  const commune = await getCommuneReference(code_insee);
  return {
    title: commune === null ? 'Commune introuvable' : `${commune.nom} — fiche commune`,
  };
}

/**
 * Fiche d'une commune (ou arrondissement) du référentiel (chantier 13.3-C).
 *
 * Affiche les compteurs territoriaux ANONYMISÉS (inscrit·es, signataires,
 * abonné·es), calculés par résolution code_postal -> commune la plus peuplée.
 * Les membres ne sont jamais agrégés anonymement : ils n'apparaissent que via
 * la commune LIBRE correspondante (s'ils l'ont rejointe), où le flux existant
 * (chantier 5.2) gère leur affichage et le bouton « rejoindre » dans le
 * respect de la RLS et des réglages de visibilité.
 */
export default async function PageFicheCommune({ params }: PageFicheCommuneProps) {
  const { code_insee } = await params;
  const commune = await getCommuneReference(code_insee);
  if (commune === null) {
    notFound();
  }

  const [compteurs, communeLibre] = await Promise.all([
    getCompteursCommune(code_insee),
    getCommuneLibreParInsee(code_insee),
  ]);

  const estArrondissement = commune.type === 'arrondissement';
  const formateurNombre = new Intl.NumberFormat('fr-FR');

  return (
    <Container className="py-8">
      <Link href="/communes" className="text-sm text-text-3 hover:text-brand">
        ← Carte des communes
      </Link>

      <header className="mt-2">
        <div className="flex flex-wrap items-center gap-2">
          <Heading niveau={1}>{commune.nom}</Heading>
          <Badge variant="default">{estArrondissement ? 'Arrondissement' : 'Commune'}</Badge>
        </div>
        <p className="mt-2 text-text-3">
          INSEE {commune.code_insee}
          {commune.code_departement !== null ? ` · département ${commune.code_departement}` : ''}
          {commune.region !== null ? ` · ${commune.region}` : ''}
          {commune.population !== null
            ? ` · ${formateurNombre.format(commune.population)} habitant·es`
            : ''}
        </p>
      </header>

      <section className="mt-6 grid gap-3" aria-label="Compteurs de la commune">
        {compteurs === null ? (
          <Alert variant="info" titre="Compteurs en cours d’activation">
            Les compteurs anonymisés (inscrit·es, signataires, abonné·es) seront disponibles dès que
            la fonction d’agrégation aura été activée sur la base.
          </Alert>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard libelle="Inscrit·es" valeur={formateurNombre.format(compteurs.inscrits)} />
            <StatCard
              libelle="Signataires"
              valeur={formateurNombre.format(compteurs.signataires)}
            />
            <StatCard libelle="Abonné·es" valeur={formateurNombre.format(compteurs.abonnes)} />
          </div>
        )}
        <p className="text-xs text-text-3">
          Compteurs agrégés et anonymisés, rattachés par code postal (résolution : commune la plus
          peuplée desservie par le code postal).
        </p>
      </section>

      <section className="mt-8 grid gap-3" aria-label="Membres de la commune">
        <Heading niveau={2} apparenceComme={3}>
          Membres
        </Heading>
        {communeLibre !== null ? (
          <Card variant="ombre" className="grid gap-3">
            <p className="text-text-2">
              Cette commune est active sur le mouvement. Les membres qui l’ont rejointe y
              apparaissent nommément.
            </p>
            <Link
              href={`/agir/communes/${communeLibre.slug}`}
              className="font-bold text-brand underline-offset-4 hover:underline"
            >
              Voir la commune libre et la rejoindre →
            </Link>
          </Card>
        ) : (
          <Alert variant="info" titre="Personne n’a encore rejoint cette commune">
            Sois la première personne à l’activer : en rejoignant une commune, tu permets d’y
            organiser des actions locales. Les membres apparaissent nommément une fois la commune
            rejointe (les signataires et abonné·es, eux, restent toujours anonymisés).
          </Alert>
        )}
      </section>
    </Container>
  );
}

function StatCard({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <Card variant="ombre" className="grid gap-1 text-center">
      <span className="font-display font-bold text-3xl text-text-1">{valeur}</span>
      <span className="text-sm text-text-3">{libelle}</span>
    </Card>
  );
}
