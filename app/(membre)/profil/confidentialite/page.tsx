import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getPersonneOuRediriger } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { getSupabaseServer } from '@/lib/supabase';
import { type PreferencesVisibilite, preferencesVisibiliteSchema } from '@/lib/validations/profil';
import type { Metadata } from 'next';
import { BoutonExportZip } from './BoutonExportZip';
import { FormulaireVisibilite } from './FormulaireVisibilite';
import { SectionDeuxFA } from './SectionDeuxFA';
import { SectionSuppression } from './SectionSuppression';

export const metadata: Metadata = {
  title: 'Confidentialité',
};

const FALLBACKS = {
  titre: 'Confidentialité et sécurité',
  intro:
    'Tes droits RGPD à un endroit : visibilité de chaque champ, export, suppression différée, 2FA. On respecte ta vie privée par défaut.',
  sectionVisibiliteTitre: 'Visibilité par champ',
  sectionVisibiliteHint:
    'Pour chaque information de ton profil, choisis qui peut la voir. Défaut : visible aux membres connecté·es.',
  sectionExportTitre: 'Export de mes données',
  sectionExportHint:
    'Droit à la portabilité : récupère un ZIP avec ton profil, tes contributions, tes paiements, tes messages, et tes médias. Lien envoyé par mail sous 24h.',
  section2faTitre: 'Authentification à deux facteurs (2FA)',
  sectionSuppressionTitre: 'Suppression de mon compte',
  sectionSuppressionHint:
    'Droit à l’effacement. 30 jours de grâce pour changer d’avis. Tes contributions sont préservées sous « Membre anonyme » pour ne pas effacer la trace politique.',
};

/**
 * Centre des paramètres RGPD + sécurité (cf. 05_RGPD.md §8) :
 * - visibilité par champ
 * - export ZIP de toutes mes données (droit à la portabilité)
 * - suppression différée 30 jours (droit à l'effacement)
 * - 2FA TOTP
 */
export default async function PageConfidentialite({
  searchParams,
}: {
  searchParams: Promise<{ '2fa'?: string }>;
}) {
  const { personne, email } = await getPersonneOuRediriger('/profil/confidentialite');
  const supabase = await getSupabaseServer();

  // Visibilité par champ : on récupère les valeurs existantes (jsonb).
  // Si la sous-structure est invalide, on retombe sur un objet vide.
  const prefs =
    typeof personne.preferences_visibilite === 'object' && personne.preferences_visibilite !== null
      ? (personne.preferences_visibilite as Record<string, unknown>)
      : {};
  // On ne passe à FormulaireVisibilite que les clés connues (les autres,
  // comme `notifications`, restent dans le jsonb mais pas dans ce form).
  const parse = preferencesVisibiliteSchema.safeParse(prefs);
  const valeursInitialesVisibilite: PreferencesVisibilite = parse.success ? parse.data : {};

  // 2FA : on liste les facteurs TOTP actifs.
  const { data: facteurs } = await supabase.auth.mfa.listFactors();
  const facteurTotp = facteurs?.totp[0];

  const params = await searchParams;
  const vientDActiverDeuxFA = params['2fa'] === 'active';

  const [
    estAdmin,
    titre,
    intro,
    sectionVisibiliteTitre,
    sectionVisibiliteHint,
    sectionExportTitre,
    sectionExportHint,
    section2faTitre,
    sectionSuppressionTitre,
    sectionSuppressionHint,
  ] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('profil.confidentialite.titre', { valeurMd: FALLBACKS.titre }),
    lireContenuEditorial('profil.confidentialite.intro', { valeurMd: FALLBACKS.intro }),
    lireContenuEditorial('profil.confidentialite.section_visibilite_titre', {
      valeurMd: FALLBACKS.sectionVisibiliteTitre,
    }),
    lireContenuEditorial('profil.confidentialite.section_visibilite_hint', {
      valeurMd: FALLBACKS.sectionVisibiliteHint,
    }),
    lireContenuEditorial('profil.confidentialite.section_export_titre', {
      valeurMd: FALLBACKS.sectionExportTitre,
    }),
    lireContenuEditorial('profil.confidentialite.section_export_hint', {
      valeurMd: FALLBACKS.sectionExportHint,
    }),
    lireContenuEditorial('profil.confidentialite.section_2fa_titre', {
      valeurMd: FALLBACKS.section2faTitre,
    }),
    lireContenuEditorial('profil.confidentialite.section_suppression_titre', {
      valeurMd: FALLBACKS.sectionSuppressionTitre,
    }),
    lireContenuEditorial('profil.confidentialite.section_suppression_hint', {
      valeurMd: FALLBACKS.sectionSuppressionHint,
    }),
  ]);

  return (
    <article className="grid gap-8">
      <header>
        <TexteEditableAdmin
          cle="profil.confidentialite.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre page confidentialite"
          longueurMax={60}
        >
          {(t) => <Heading niveau={1}>{t}</Heading>}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="profil.confidentialite.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro page confidentialite"
          multilignes
          longueurMax={300}
        >
          {(t) => <p className="mt-2 text-text-2">{t}</p>}
        </TexteEditableAdmin>
      </header>

      <Card variant="ombre">
        <TexteEditableAdmin
          cle="profil.confidentialite.section_visibilite_titre"
          valeurInitiale={sectionVisibiliteTitre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre section visibilite"
          longueurMax={40}
        >
          {(t) => (
            <Heading niveau={3} className="mb-4 text-lg">
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="profil.confidentialite.section_visibilite_hint"
          valeurInitiale={sectionVisibiliteHint.valeurMd}
          estAdmin={estAdmin}
          libelle="hint section visibilite"
          multilignes
          longueurMax={300}
        >
          {(t) => <p className="mb-4 text-sm text-text-2">{t}</p>}
        </TexteEditableAdmin>
        <FormulaireVisibilite valeursInitiales={valeursInitialesVisibilite} />
      </Card>

      <Card variant="ombre">
        <TexteEditableAdmin
          cle="profil.confidentialite.section_export_titre"
          valeurInitiale={sectionExportTitre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre section export"
          longueurMax={40}
        >
          {(t) => (
            <Heading niveau={3} className="mb-4 text-lg">
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="profil.confidentialite.section_export_hint"
          valeurInitiale={sectionExportHint.valeurMd}
          estAdmin={estAdmin}
          libelle="hint section export"
          multilignes
          longueurMax={300}
        >
          {(t) => <p className="mb-4 text-sm text-text-2">{t}</p>}
        </TexteEditableAdmin>
        <BoutonExportZip />
      </Card>

      <Card variant="ombre">
        <TexteEditableAdmin
          cle="profil.confidentialite.section_2fa_titre"
          valeurInitiale={section2faTitre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre section 2FA"
          longueurMax={60}
        >
          {(t) => (
            <Heading niveau={3} className="mb-4 text-lg">
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <SectionDeuxFA factorId={facteurTotp?.id ?? null} vientDActiver={vientDActiverDeuxFA} />
      </Card>

      <Card variant="ombre">
        <TexteEditableAdmin
          cle="profil.confidentialite.section_suppression_titre"
          valeurInitiale={sectionSuppressionTitre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre section suppression compte"
          longueurMax={40}
        >
          {(t) => (
            <Heading niveau={3} className="mb-4 text-lg">
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="profil.confidentialite.section_suppression_hint"
          valeurInitiale={sectionSuppressionHint.valeurMd}
          estAdmin={estAdmin}
          libelle="hint section suppression"
          multilignes
          longueurMax={400}
        >
          {(t) => <p className="mb-4 text-sm text-text-2">{t}</p>}
        </TexteEditableAdmin>
        <SectionSuppression
          email={email}
          suppressionDemandeeLe={personne.suppression_demandee_le}
        />
      </Card>
    </article>
  );
}
