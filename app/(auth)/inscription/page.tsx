import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FormulaireInscription } from './FormulaireInscription';

export const metadata: Metadata = {
  title: 'Créer un compte',
};

const FALLBACKS = {
  titre: 'Créer mon compte',
  intro: 'Bienvenue. Quelques minutes pour rejoindre Maintenant!.',
  bottomAmorce: 'Déjà un compte ?',
  bottomLien: 'Se connecter',
};

/**
 * Page d'inscription : formulaire complet avec Turnstile et CGU.
 *
 * La page elle-même est un Server Component ; le formulaire est isolé en
 * Client Component (`FormulaireInscription`) parce qu'il a besoin de
 * `react-hook-form` (state + onSubmit).
 */
// Helper local pour reduire la verbosite (V2.4.136).
async function lireLibellesFormulaire() {
  const cles = [
    ['labelPrenom', 'Prénom'],
    ['labelNom', 'Nom'],
    ['labelPronom', 'Pronom'],
    ['hintPronom', 'Demandé pour te genrer correctement dans la newsletter et les communications.'],
    ['placeholderPronom', 'ex : elle, il, iel, elle/il...'],
    ['labelEmail', 'Adresse email'],
    ['labelCodePostal', 'Code postal'],
    ['labelTelephone', 'Téléphone (optionnel)'],
    ['placeholderTelephone', '06 12 34 56 78'],
    ['labelDateNaissance', 'Date de naissance'],
    ['hintDateNaissance', '15 ans révolus minimum (recommandation CNIL).'],
    ['labelMotDePasse', 'Mot de passe'],
    ['hintMotDePasse', '12 caractères minimum, au moins 1 minuscule, 1 majuscule et 1 chiffre.'],
    ['labelCgu', 'J’accepte la politique de confidentialité de Maintenant!.'],
    ['alertErreurTitre', 'Erreur'],
    ['alertDejaInscritTitre', 'Email déjà inscrit'],
    ['lienAllerConnexion', 'Aller à la connexion'],
    ['lienResetMdp', 'Réinitialiser mon mot de passe'],
  ] as const;
  const lectures = await Promise.all(
    cles.map(([nom, defaut]) =>
      lireContenuEditorial(`inscription.formulaire.${nom}`, { valeurMd: defaut }),
    ),
  );
  return Object.fromEntries(cles.map(([nom], i) => [nom, lectures[i]?.valeurMd ?? ''])) as Record<
    (typeof cles)[number][0],
    string
  >;
}

export default async function PageInscription() {
  const [
    estAdmin,
    titre,
    intro,
    bottomAmorce,
    bottomLien,
    ctaSubmit,
    ctaEnCours,
    ctaChargement,
    libellesFormulaire,
  ] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('inscription.titre', { valeurMd: FALLBACKS.titre }),
    lireContenuEditorial('inscription.intro', { valeurMd: FALLBACKS.intro }),
    lireContenuEditorial('inscription.bottom.amorce', { valeurMd: FALLBACKS.bottomAmorce }),
    lireContenuEditorial('inscription.bottom.lien', { valeurMd: FALLBACKS.bottomLien }),
    lireContenuEditorial('inscription.cta_submit', { valeurMd: 'Créer mon compte' }),
    lireContenuEditorial('inscription.cta_en_cours', { valeurMd: 'Envoi en cours...' }),
    lireContenuEditorial('inscription.cta_chargement', { valeurMd: 'Chargement…' }),
    lireLibellesFormulaire(),
  ]);

  return (
    <article className="grid gap-6">
      <header>
        <TexteEditableAdmin
          cle="inscription.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre de la page inscription"
          longueurMax={60}
        >
          {(t) => <Heading niveau={1}>{t}</Heading>}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="inscription.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro de la page inscription"
          multilignes
          longueurMax={300}
        >
          {(t) => <p className="mt-2 text-text-2">{t}</p>}
        </TexteEditableAdmin>
      </header>

      <FormulaireInscription
        libelles={{
          ctaSubmit: ctaSubmit.valeurMd,
          ctaEnCours: ctaEnCours.valeurMd,
          ctaChargement: ctaChargement.valeurMd,
          ...libellesFormulaire,
        }}
      />

      <p className="text-sm text-text-3">
        <TexteEditableAdmin
          cle="inscription.bottom.amorce"
          valeurInitiale={bottomAmorce.valeurMd}
          estAdmin={estAdmin}
          libelle="amorce bas de page inscription"
          longueurMax={60}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>{' '}
        <TexteEditableAdmin
          cle="inscription.bottom.lien"
          valeurInitiale={bottomLien.valeurMd}
          estAdmin={estAdmin}
          libelle="libelle lien Se connecter (bas page inscription)"
          longueurMax={40}
        >
          {(t) => (
            <Link href="/connexion" className="text-brand underline-offset-4 hover:underline">
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </p>
    </article>
  );
}
