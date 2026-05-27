import { signerPetition } from '@/app/(public)/mobiliser/petitions/actions';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { ModaleSignaturePetition } from '@/components/modales/ModaleSignaturePetition';
import { CompteurStretch } from '@/components/petitions/CompteurStretch';
import { Badge, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { petitionAlaUne } from '@/lib/petitions/requetes';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { UneSection } from './UneSection';

const FALLBACKS = {
  badge: 'Pétition en cours',
  voirTous: 'Voir toutes les pétitions',
  ctaPrincipal: 'Signer en quelques secondes',
  ctaSecondaire: 'Lire la pétition',
  preposition: 'À',
  emptyAvant: 'Aucune pétition publiée pour le moment.',
  emptyLien: 'Lance la première',
};

/**
 * Une « pétition » de la page d'accueil (chantier 2.1 + 3.1).
 *
 * Branche désormais sur la pétition publiée la plus récente. Si aucune
 * n'existe, on retombe sur l'état vide hérité du chantier 2.1 (lien
 * `voir toutes` qui pointe sur la liste).
 *
 * Le CTA principal est un bouton qui ouvre `<ModaleSignaturePetition>`,
 * le secondaire est un lien vers la fiche détail. Cohérent avec la spec
 * §3 : « Signer en modale + Voir toutes ».
 */
export async function UnePetition() {
  const [
    petition,
    estAdmin,
    badge,
    voirTous,
    ctaPrincipal,
    ctaSecondaire,
    preposition,
    emptyAvant,
    emptyLien,
  ] = await Promise.all([
    petitionAlaUne(),
    estAdminCourant(),
    lireContenuEditorial('home.une.petition.badge', { valeurMd: FALLBACKS.badge }),
    lireContenuEditorial('home.une.petition.voir_tous', { valeurMd: FALLBACKS.voirTous }),
    lireContenuEditorial('home.une.petition.cta_principal', {
      valeurMd: FALLBACKS.ctaPrincipal,
    }),
    lireContenuEditorial('home.une.petition.cta_secondaire', {
      valeurMd: FALLBACKS.ctaSecondaire,
    }),
    lireContenuEditorial('home.une.petition.preposition_destinataire', {
      valeurMd: FALLBACKS.preposition,
    }),
    lireContenuEditorial('home.une.petition.empty_avant', { valeurMd: FALLBACKS.emptyAvant }),
    lireContenuEditorial('home.une.petition.empty_lien', { valeurMd: FALLBACKS.emptyLien }),
  ]);

  if (petition === null) {
    return (
      <UneSection
        type={badge.valeurMd}
        cleBadge="home.une.petition.badge"
        couleur="brand"
        titre={null}
        voirTousHref="/mobiliser/petitions"
        voirTousLibelle={voirTous.valeurMd}
        cleVoirTous="home.une.petition.voir_tous"
        estAdmin={estAdmin}
        enAttente={
          <p>
            <TexteEditableAdmin
              cle="home.une.petition.empty_avant"
              valeurInitiale={emptyAvant.valeurMd}
              estAdmin={estAdmin}
              libelle="empty state texte avant le lien"
              longueurMax={150}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>{' '}
            <TexteEditableAdmin
              cle="home.une.petition.empty_lien"
              valeurInitiale={emptyLien.valeurMd}
              estAdmin={estAdmin}
              libelle="empty state libelle du lien"
              longueurMax={50}
            >
              {(t) => (
                <Link href="/mobiliser/petitions/nouvelle" className="text-brand hover:underline">
                  {t}
                </Link>
              )}
            </TexteEditableAdmin>
            .
          </p>
        }
      />
    );
  }

  const createuricePrenomAffiche =
    petition.createurice_prenom !== null && petition.createurice_prenom.trim() !== ''
      ? petition.createurice_prenom
      : 'la personne créatrice';

  return (
    <Card variant="ombre" className="grid gap-4">
      <header className="flex items-center justify-between gap-3">
        <TexteEditableAdmin
          cle="home.une.petition.badge"
          valeurInitiale={badge.valeurMd}
          estAdmin={estAdmin}
          libelle="texte du badge Une petition"
          longueurMax={40}
        >
          {(t) => <Badge variant="brand">{t}</Badge>}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="home.une.petition.voir_tous"
          valeurInitiale={voirTous.valeurMd}
          estAdmin={estAdmin}
          libelle="libelle du lien Voir toutes les petitions"
          longueurMax={60}
        >
          {(t) => (
            <Link href="/mobiliser/petitions" className="text-xs text-text-3 hover:text-brand">
              {t} →
            </Link>
          )}
        </TexteEditableAdmin>
      </header>

      <Heading niveau={3} className="text-2xl">
        <Link
          href={`/mobiliser/petitions/${petition.slug}`}
          className="text-text-1 underline-offset-4 hover:underline"
        >
          {petition.titre}
        </Link>
      </Heading>

      <p className="text-sm text-text-3">
        <TexteEditableAdmin
          cle="home.une.petition.preposition_destinataire"
          valeurInitiale={preposition.valeurMd}
          estAdmin={estAdmin}
          libelle="preposition avant le destinataire (defaut : À)"
          longueurMax={10}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>{' '}
        <strong className="text-text-2">{petition.destinataire}</strong>
      </p>

      <CompteurStretch
        signatures={petition.nombre_signatures}
        objectif={petition.objectif}
        taille="sm"
      />

      <div className="flex flex-wrap items-center gap-3">
        <ModaleSignaturePetition
          petitionId={petition.id}
          petitionTitre={petition.titre}
          createuricePrenom={createuricePrenomAffiche}
          signerPetition={signerPetition}
          declencheur={
            <TexteEditableAdmin
              cle="home.une.petition.cta_principal"
              valeurInitiale={ctaPrincipal.valeurMd}
              estAdmin={estAdmin}
              libelle="libelle du CTA principal (declenche la modale de signature)"
              longueurMax={50}
            >
              {(t) => (
                <span
                  className={cn(
                    'inline-flex h-11 items-center justify-center rounded-md bg-grad px-5',
                    'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
                  )}
                >
                  {t}
                </span>
              )}
            </TexteEditableAdmin>
          }
        />
        <TexteEditableAdmin
          cle="home.une.petition.cta_secondaire"
          valeurInitiale={ctaSecondaire.valeurMd}
          estAdmin={estAdmin}
          libelle="libelle du lien secondaire 'Lire la petition'"
          longueurMax={50}
        >
          {(t) => (
            <Link
              href={`/mobiliser/petitions/${petition.slug}`}
              className="text-sm text-brand underline-offset-4 hover:underline"
            >
              {t} →
            </Link>
          )}
        </TexteEditableAdmin>
      </div>
    </Card>
  );
}
