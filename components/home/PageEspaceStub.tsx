import { Alert, Card, Container, Heading } from '@/components/ui';
import type { Espace } from '@/config/espaces';

interface PageEspaceStubProps {
  espace: Espace;
  /**
   * Optionnel : pour chaque sous-espace, le numéro du chantier qui le
   * livrera. Affiché à droite du libellé. Sinon, on affiche juste
   * « bientôt ».
   */
  chantiersParSousEspace?: Record<string, string>;
}

/**
 * Page racine d'un espace, en stub pour le chantier 2.1.
 *
 * Affiche le titre de l'espace et la liste des sous-espaces qui seront
 * livrés dans les chantiers à venir. Aucun lien : tant que les pages
 * sous-espaces n'existent pas, on ne crée pas de lien mort.
 *
 * Sera remplacée par la vraie page racine de chaque espace au fil des
 * chantiers (2.2, 3.x, 4.x, 5.x, 7.x).
 */
export function PageEspaceStub({ espace, chantiersParSousEspace = {} }: PageEspaceStubProps) {
  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">Espace</p>
        <Heading niveau={1} className="mt-1">
          {espace.libelle}
        </Heading>
      </header>

      <Alert variant="info" titre="Espace en construction">
        Cette page racine d'espace sera enrichie au fil des chantiers de phase 3 à 7. Le squelette
        ci-dessous liste les sous-espaces qui composeront cet espace.
      </Alert>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {espace.sousEspaces.map((sousEspace) => (
          <Card key={sousEspace.slug} variant="plat">
            <div className="flex items-start justify-between gap-3">
              <p className="font-bold text-text-1">{sousEspace.libelle}</p>
              <span className="font-mono text-xs text-text-3">
                {chantiersParSousEspace[sousEspace.slug] ?? 'bientôt'}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-text-3">
              /{espace.slug}/{sousEspace.slug}
            </p>
          </Card>
        ))}
      </div>
    </Container>
  );
}
