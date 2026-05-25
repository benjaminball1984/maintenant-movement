import { Alert, Badge, Card, Heading } from '@/components/ui';
import { listerToutesPetitionsAdmin } from '@/lib/petitions/requetes';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Gestion des pétitions',
};

/**
 * Gestion (édition) des pétitions par l'équipe (chantier 13.2).
 *
 * Liste toutes les pétitions, tous statuts confondus, avec un accès à
 * l'édition de chacune. Distincte de la file de modération
 * (`/admin/moderation/petitions`), qui ne montre que les pétitions en
 * attente de décision. La lecture complète est autorisée par la RLS aux
 * admins et modérateurices ; le layout `/admin` garantit déjà l'accès.
 */
export default async function PageGestionPetitions() {
  const petitions = await listerToutesPetitionsAdmin();
  const formateurNombre = new Intl.NumberFormat('fr-FR');

  return (
    <section className="grid gap-6">
      <header>
        <Heading niveau={1} apparenceComme={2}>
          Gestion des pétitions
        </Heading>
        <p className="mt-2 text-text-2">
          Toutes les pétitions, tous statuts confondus. Édite le contenu, l'objectif et les dates de
          lancement et d'échéance.
        </p>
      </header>

      {petitions.length === 0 ? (
        <Alert variant="info" titre="Aucune pétition">
          Aucune pétition n'a encore été créée.
        </Alert>
      ) : (
        <ul className="grid gap-3">
          {petitions.map((petition) => (
            <li key={petition.id}>
              <Card variant="ombre" className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge variant={petition.statut === 'publiee' ? 'success' : 'default'}>
                    {petition.statut}
                  </Badge>
                  <p className="mt-1 font-bold text-text-1">{petition.titre}</p>
                  <p className="text-xs text-text-3">
                    Objectif : {formateurNombre.format(petition.objectif)} signataires
                  </p>
                </div>
                <Link
                  href={`/admin/petitions/${petition.slug}`}
                  className="text-sm font-bold text-brand underline-offset-4 hover:underline"
                >
                  Éditer
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
