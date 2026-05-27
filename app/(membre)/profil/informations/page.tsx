import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getPersonneOuRediriger } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { getNumeroUnifie } from '@/lib/profil/unifie';
import type { DonneesMiseAJourProfil } from '@/lib/validations/profil';
import type { Metadata } from 'next';
import { FormulaireInformations, type LibellesInformations } from './FormulaireInformations';

async function lireLibellesFormulaire(): Promise<LibellesInformations> {
  const cles = [
    ['alertErreurTitre', 'Sauvegarde impossible'],
    ['alertSuccesTitre', 'Modifications enregistrées'],
    ['alertSuccesMessage', 'Tes informations sont à jour.'],
    ['sectionIdentite', 'Identité'],
    ['labelPrenom', 'Prénom'],
    ['labelNom', 'Nom'],
    ['labelPronom', 'Pronom'],
    ['sectionCoordonnees', 'Coordonnées'],
    ['labelCodePostal', 'Code postal'],
    ['labelTelephone', 'Téléphone (optionnel)'],
    ['sectionPresentation', 'Présentation publique'],
    ['labelPhoto', 'Photo de profil (URL)'],
    ['labelBio', 'Bio courte (500 caractères max)'],
    ['sectionPreference', 'Préférence d’interface'],
    ['labelTheme', 'Thème par défaut'],
    ['themeAuto', 'Automatique (suit le système)'],
    ['themeClair', 'Clair'],
    ['themeSombre', 'Sombre'],
    ['ctaSubmit', 'Enregistrer les modifications'],
    ['ctaEnCours', 'Envoi en cours...'],
  ] as const;
  const lectures = await Promise.all(
    cles.map(([nom, defaut]) =>
      lireContenuEditorial(`profil.informations.form.${nom}`, { valeurMd: defaut }),
    ),
  );
  return Object.fromEntries(
    cles.map(([nom], i) => [nom, lectures[i]?.valeurMd ?? '']),
  ) as unknown as LibellesInformations;
}

export const metadata: Metadata = {
  title: 'Mes informations',
};

const FALLBACKS = {
  titre: 'Mes informations',
  intro:
    'Ces champs sont modifiables à tout moment. La visibilité de chacun se règle dans l’onglet Confidentialité.',
  cardNumeroLabel: 'Ton numéro Maintenant!',
  cardNumeroEnAttente: 'En cours d’activation.',
  cardNumeroHint:
    'Cet identifiant t’appartient à vie. Il te relie à tes contributions (pétitions signées, etc.) même si tu changes d’adresse email.',
};

export default async function PageInformations() {
  const { personne } = await getPersonneOuRediriger('/profil/informations');
  const [
    numeroUnifie,
    estAdmin,
    titre,
    intro,
    cardNumeroLabel,
    cardNumeroEnAttente,
    cardNumeroHint,
    libellesFormulaire,
  ] = await Promise.all([
    getNumeroUnifie(personne.id),
    estAdminCourant(),
    lireContenuEditorial('profil.informations.titre', { valeurMd: FALLBACKS.titre }),
    lireContenuEditorial('profil.informations.intro', { valeurMd: FALLBACKS.intro }),
    lireContenuEditorial('profil.informations.card_numero_label', {
      valeurMd: FALLBACKS.cardNumeroLabel,
    }),
    lireContenuEditorial('profil.informations.card_numero_en_attente', {
      valeurMd: FALLBACKS.cardNumeroEnAttente,
    }),
    lireContenuEditorial('profil.informations.card_numero_hint', {
      valeurMd: FALLBACKS.cardNumeroHint,
    }),
    lireLibellesFormulaire(),
  ]);

  const valeursInitiales: DonneesMiseAJourProfil = {
    nom: personne.nom ?? '',
    prenom: personne.prenom ?? '',
    pronom: personne.pronom ?? '',
    code_postal: personne.code_postal ?? '',
    telephone: personne.telephone ?? '',
    photo_url: personne.photo_url ?? '',
    bio: personne.bio ?? '',
    mode_theme: personne.mode_theme ?? 'auto',
  };

  return (
    <article className="grid gap-6">
      <header>
        <TexteEditableAdmin
          cle="profil.informations.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre page informations"
          longueurMax={60}
        >
          {(t) => <Heading niveau={1}>{t}</Heading>}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="profil.informations.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro page informations"
          multilignes
          longueurMax={300}
        >
          {(t) => <p className="mt-2 text-text-2">{t}</p>}
        </TexteEditableAdmin>
      </header>

      <Card variant="ombre" className="grid gap-1">
        <TexteEditableAdmin
          cle="profil.informations.card_numero_label"
          valeurInitiale={cardNumeroLabel.valeurMd}
          estAdmin={estAdmin}
          libelle="label card Ton numero Maintenant"
          longueurMax={40}
        >
          {(t) => <p className="text-xs font-bold uppercase tracking-cap text-text-3">{t}</p>}
        </TexteEditableAdmin>
        {numeroUnifie !== null ? (
          <p className="font-mono text-lg text-text-1">{numeroUnifie}</p>
        ) : (
          <TexteEditableAdmin
            cle="profil.informations.card_numero_en_attente"
            valeurInitiale={cardNumeroEnAttente.valeurMd}
            estAdmin={estAdmin}
            libelle="message si numero en attente"
            longueurMax={60}
          >
            {(t) => <p className="text-text-2">{t}</p>}
          </TexteEditableAdmin>
        )}
        <TexteEditableAdmin
          cle="profil.informations.card_numero_hint"
          valeurInitiale={cardNumeroHint.valeurMd}
          estAdmin={estAdmin}
          libelle="hint card numero"
          multilignes
          longueurMax={400}
        >
          {(t) => <p className="text-sm text-text-3">{t}</p>}
        </TexteEditableAdmin>
      </Card>

      <FormulaireInformations valeursInitiales={valeursInitiales} libelles={libellesFormulaire} />
    </article>
  );
}
