import { modererPetition } from '@/app/(public)/mobiliser/petitions/actions';
import { FormulaireModeration } from '@/components/petitions/FormulaireModeration';
import { Alert, Card, Heading } from '@/components/ui';
import { listerPetitionsAModerer } from '@/lib/petitions/requetes';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Modération des pétitions',
};

/**
 * Console de modération des pétitions (chantier 3.1).
 *
 * Liste les pétitions au statut `en_moderation`, dans l'ordre d'arrivée
 * (FIFO). Chaque ligne propose deux actions : publier ou rejeter (avec
 * motif). Les boutons appellent la Server Action `modererPetition`, qui
 * met à jour le statut et journalise la décision.
 *
 * Accès : layout parent (`/admin`) garantit déjà l'auth + au moins un
 * droit admin/modération. La Server Action revérifie côté serveur le
 * droit `petitions` spécifique (défense en profondeur).
 */
export default async function PageModerationPetitions() {
  const petitions = await listerPetitionsAModerer();

  return (
    <section className="grid gap-6">
      <header>
        <Heading niveau={1} apparenceComme={2}>
          Modération des pétitions
        </Heading>
        <p className="mt-2 text-text-2">
          Pétitions en attente de publication, triées par ordre d'arrivée. Délai cible : moins de 48
          heures.
        </p>
      </header>

      {petitions.length === 0 ? (
        <Alert variant="success" titre="File vide">
          Aucune pétition à modérer pour le moment.
        </Alert>
      ) : (
        <ul className="grid gap-4">
          {petitions.map((petition) => {
            const auteurice =
              [petition.createurice_prenom, petition.createurice_nom]
                .filter((s) => s !== null && s.trim() !== '')
                .join(' ') || 'Auteurice inconnue';
            const soumiseLe = new Date(petition.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });
            return (
              <li key={petition.id}>
                <Card variant="ombre" className="grid gap-4">
                  <header className="flex flex-wrap items-baseline justify-between gap-2">
                    <Heading niveau={2} apparenceComme={3}>
                      <Link
                        href={`/mobiliser/petitions/${petition.slug}`}
                        className="text-text-1 underline-offset-4 hover:underline"
                        target="_blank"
                        rel="noopener"
                      >
                        {petition.titre}
                      </Link>
                    </Heading>
                    <p className="text-xs text-text-3">
                      Par <strong className="text-text-2">{auteurice}</strong> · soumise le{' '}
                      {soumiseLe}
                    </p>
                  </header>

                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="font-bold text-text-3">Destinataire</dt>
                      <dd className="text-text-2">{petition.destinataire}</dd>
                    </div>
                    <div>
                      <dt className="font-bold text-text-3">Objectif</dt>
                      <dd className="text-text-2">
                        {new Intl.NumberFormat('fr-FR').format(petition.objectif)} signataires
                      </dd>
                    </div>
                  </dl>

                  <details>
                    <summary className="cursor-pointer text-sm font-bold text-brand">
                      Voir le texte complet
                    </summary>
                    <p className="mt-3 whitespace-pre-line text-sm text-text-2 leading-relaxed">
                      {petition.texte}
                    </p>
                  </details>

                  <FormulaireModeration
                    petitionId={petition.id}
                    modererPetition={modererPetition}
                  />
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
