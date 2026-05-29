import { retablirCagnotte, suspendreCagnotte } from '@/app/(public)/mobiliser/cagnottes/actions';
import { FormulaireModerationCagnotte } from '@/components/cagnottes/FormulaireModerationCagnotte';
import { JaugeT99CPEuros } from '@/components/cagnottes/JaugeT99CPEuros';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { listerCagnottesAVerifier } from '@/lib/cagnottes/requetes';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Modération des cagnottes',
};

const LIBELLE_TYPE: Record<string, string> = {
  ouverte: 'Cagnotte ouverte',
  lutte: 'Caisse de lutte',
  cotisation: 'Cotisation',
};

/**
 * Console de modération des cagnottes (chantier 3.3).
 *
 * Modération a posteriori : les cagnottes sont déjà publiques. On liste
 * les 50 plus récentes (statuts `publiee` ou `suspendue`) pour permettre
 * la vérification et la suspension / rétablissement.
 */
export default async function PageModerationCagnottes() {
  const [cagnottes, estAdmin, titre, intro] = await Promise.all([
    listerCagnottesAVerifier(),
    estAdminCourant(),
    lireContenuEditorial('admin.moderation.cagnottes.titre', {
      valeurMd: 'Modération des cagnottes',
    }),
    lireContenuEditorial('admin.moderation.cagnottes.intro', {
      valeurMd:
        'Modération **a posteriori** : les cagnottes sont déjà publiques. Suspension en cas de comportement louche (raison obligatoire, visible publiquement).',
    }),
  ]);

  return (
    <section className="grid gap-6">
      <header>
        <TexteEditableAdmin
          cle="admin.moderation.cagnottes.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre console cagnottes"
          longueurMax={60}
        >
          {(t) => (
            <Heading niveau={1} apparenceComme={2}>
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="admin.moderation.cagnottes.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro console cagnottes"
          multilignes
          longueurMax={300}
        >
          {(t) => <p className="mt-2 text-text-2">{t}</p>}
        </TexteEditableAdmin>
      </header>

      {cagnottes.length === 0 ? (
        <Alert variant="info" titre="Aucune cagnotte à vérifier">
          Rien dans la file.
        </Alert>
      ) : (
        <ul className="grid gap-4">
          {cagnottes.map((cagnotte) => {
            const auteurice =
              [cagnotte.createurice_prenom, cagnotte.createurice_nom]
                .filter((s) => s !== null && s.trim() !== '')
                .join(' ') || 'Auteurice inconnue';
            const creeLe = new Date(cagnotte.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });

            return (
              <li key={cagnotte.id}>
                <Card variant="ombre" className="grid gap-4">
                  <header className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <Heading niveau={2} apparenceComme={3}>
                        <Link
                          href={`/mobiliser/cagnottes/${cagnotte.slug}`}
                          className="text-text-1 underline-offset-4 hover:underline"
                          target="_blank"
                          rel="noopener"
                        >
                          {cagnotte.titre}
                        </Link>
                      </Heading>
                      <p className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant={cagnotte.type === 'cotisation' ? 'accent' : 'success'}>
                          {LIBELLE_TYPE[cagnotte.type] ?? cagnotte.type}
                        </Badge>
                        {cagnotte.statut === 'suspendue' ? (
                          <Badge variant="warning">Suspendue</Badge>
                        ) : null}
                      </p>
                    </div>
                    <p className="text-xs text-text-3">
                      Par <strong className="text-text-2">{auteurice}</strong> · créée le {creeLe}
                    </p>
                  </header>

                  <JaugeT99CPEuros
                    totalEurosCentimes={cagnotte.total_euros_centimes}
                    totalT99CPUnites={cagnotte.total_t99cp_unites}
                    objectifEuros={cagnotte.objectif_euros}
                    nombreDons={cagnotte.nombre_dons}
                    taille="sm"
                  />

                  {cagnotte.statut === 'suspendue' && cagnotte.raison_suspension !== null ? (
                    <Alert variant="warning" titre="Raison de la suspension">
                      {cagnotte.raison_suspension}
                    </Alert>
                  ) : null}

                  <details>
                    <summary className="cursor-pointer text-sm font-bold text-brand">
                      Voir le texte complet
                    </summary>
                    <p className="mt-3 whitespace-pre-line text-sm text-text-2 leading-relaxed">
                      {cagnotte.texte}
                    </p>
                  </details>

                  <FormulaireModerationCagnotte
                    cagnotteId={cagnotte.id}
                    estSuspendue={cagnotte.statut === 'suspendue'}
                    suspendreCagnotte={suspendreCagnotte}
                    retablirCagnotte={retablirCagnotte}
                    libelleObjet={cagnotte.titre}
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
