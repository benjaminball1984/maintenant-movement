import { retirerMobilisation } from '@/app/(public)/mobiliser/mobilisations/actions';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { FormulaireRetrait } from '@/components/mobilisations/FormulaireRetrait';
import { Alert, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { formaterPlage } from '@/lib/mobilisations/dates';
import { listerMobilisationsAVerifier } from '@/lib/mobilisations/requetes';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Modération des mobilisations',
};

/**
 * Console de modération a posteriori des mobilisations (chantier 3.2).
 *
 * Spec §11 « modération adaptée » :
 *   - Pétitions/Campagnes : a priori (file d'attente avant publication).
 *   - Mobilisations : a posteriori (publication immédiate, retrait sur
 *     signalement ou décision modé).
 *
 * Pour 3.2 v1, on liste les 50 mobilisations publiées les plus récentes,
 * du plus neuf au plus ancien : c'est la file de vérification post-pub.
 * Une vraie file de signalement viendra avec un futur chantier qui
 * introduira la table `signalement`.
 */
export default async function PageModerationMobilisations() {
  const [mobilisations, estAdmin, titre, intro] = await Promise.all([
    listerMobilisationsAVerifier(),
    estAdminCourant(),
    lireContenuEditorial('admin.moderation.mobilisations.titre', {
      valeurMd: 'Modération des mobilisations',
    }),
    lireContenuEditorial('admin.moderation.mobilisations.intro', {
      valeurMd:
        'Modération **a posteriori** : les mobilisations sont déjà publiques. Cette liste présente les plus récentes pour permettre une vérification éclair (lieu réel, ton, calendrier). Bouton « Retirer » avec raison obligatoire.',
    }),
  ]);

  return (
    <section className="grid gap-6">
      <header>
        <TexteEditableAdmin
          cle="admin.moderation.mobilisations.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre console mobilisations"
          longueurMax={60}
        >
          {(t) => (
            <Heading niveau={1} apparenceComme={2}>
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="admin.moderation.mobilisations.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro console mobilisations"
          multilignes
          longueurMax={400}
        >
          {(t) => <p className="mt-2 text-text-2">{t}</p>}
        </TexteEditableAdmin>
      </header>

      {mobilisations.length === 0 ? (
        <Alert variant="info" titre="Aucune mobilisation publiée pour le moment">
          Rien à vérifier.
        </Alert>
      ) : (
        <ul className="grid gap-4">
          {mobilisations.map((mobilisation) => {
            const auteurice =
              [mobilisation.createurice_prenom, mobilisation.createurice_nom]
                .filter((s) => s !== null && s.trim() !== '')
                .join(' ') || 'Auteurice inconnue';
            const soumiseLe = new Date(mobilisation.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });

            return (
              <li key={mobilisation.id}>
                <Card variant="ombre" className="grid gap-4">
                  <header className="flex flex-wrap items-baseline justify-between gap-2">
                    <Heading niveau={2} apparenceComme={3}>
                      <Link
                        href={`/mobiliser/mobilisations/${mobilisation.slug}`}
                        className="text-text-1 underline-offset-4 hover:underline"
                        target="_blank"
                        rel="noopener"
                      >
                        {mobilisation.titre}
                      </Link>
                    </Heading>
                    <p className="text-xs text-text-3">
                      Par <strong className="text-text-2">{auteurice}</strong> · publiée le{' '}
                      {soumiseLe}
                    </p>
                  </header>

                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="font-bold text-text-3">Quand</dt>
                      <dd className="text-text-2">
                        {formaterPlage(mobilisation.date_debut, mobilisation.date_fin)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-bold text-text-3">Où</dt>
                      <dd className="text-text-2">{mobilisation.lieu}</dd>
                    </div>
                  </dl>

                  <details>
                    <summary className="cursor-pointer text-sm font-bold text-brand">
                      Voir la description
                    </summary>
                    <p className="mt-3 whitespace-pre-line text-sm text-text-2 leading-relaxed">
                      {mobilisation.description}
                    </p>
                  </details>

                  <FormulaireRetrait
                    mobilisationId={mobilisation.id}
                    retirerMobilisation={retirerMobilisation}
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
