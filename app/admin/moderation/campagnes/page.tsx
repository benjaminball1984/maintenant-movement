import { modererCampagne } from '@/app/(public)/mobiliser/campagnes/actions';
import { FormulaireModerationCampagne } from '@/components/campagnes/FormulaireModerationCampagne';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { listerCampagnesAModerer } from '@/lib/campagnes/requetes';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Modération des campagnes',
};

/**
 * Console de modération des campagnes (chantier 3.2).
 *
 * Calque du flux pétitions (3.1) : modération a priori, file FIFO,
 * action publier / rejeter (avec motif).
 */
export default async function PageModerationCampagnes() {
  const [campagnes, estAdmin, titre, intro] = await Promise.all([
    listerCampagnesAModerer(),
    estAdminCourant(),
    lireContenuEditorial('admin.moderation.campagnes.titre', {
      valeurMd: 'Modération des campagnes',
    }),
    lireContenuEditorial('admin.moderation.campagnes.intro', {
      valeurMd:
        "Campagnes en attente de publication, triées par ordre d'arrivée. Délai cible : moins de 48 heures.",
    }),
  ]);

  return (
    <section className="grid gap-6">
      <header>
        <TexteEditableAdmin
          cle="admin.moderation.campagnes.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre console campagnes"
          longueurMax={60}
        >
          {(t) => (
            <Heading niveau={1} apparenceComme={2}>
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="admin.moderation.campagnes.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro console campagnes"
          multilignes
          longueurMax={300}
        >
          {(t) => <p className="mt-2 text-text-2">{t}</p>}
        </TexteEditableAdmin>
      </header>

      {campagnes.length === 0 ? (
        <Alert variant="success" titre="File vide">
          Aucune campagne à modérer pour le moment.
        </Alert>
      ) : (
        <ul className="grid gap-4">
          {campagnes.map((campagne) => {
            const auteurice =
              [campagne.createurice_prenom, campagne.createurice_nom]
                .filter((s) => s !== null && s.trim() !== '')
                .join(' ') || 'Auteurice inconnue';
            const soumiseLe = new Date(campagne.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });

            return (
              <li key={campagne.id}>
                <Card variant="ombre" className="grid gap-4">
                  <header className="flex flex-wrap items-baseline justify-between gap-2">
                    <Heading niveau={2} apparenceComme={3}>
                      <Link
                        href={`/mobiliser/campagnes/${campagne.slug}`}
                        className="text-text-1 underline-offset-4 hover:underline"
                        target="_blank"
                        rel="noopener"
                      >
                        {campagne.titre}
                      </Link>
                    </Heading>
                    <p className="text-xs text-text-3">
                      Par <strong className="text-text-2">{auteurice}</strong> · soumise le{' '}
                      {soumiseLe}
                    </p>
                  </header>

                  <details>
                    <summary className="cursor-pointer text-sm font-bold text-brand">
                      Voir le texte complet
                    </summary>
                    <p className="mt-3 whitespace-pre-line text-sm text-text-2 leading-relaxed">
                      {campagne.texte}
                    </p>
                  </details>

                  <FormulaireModerationCampagne
                    campagneId={campagne.id}
                    modererCampagne={modererCampagne}
                    libelleObjet={campagne.titre}
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
