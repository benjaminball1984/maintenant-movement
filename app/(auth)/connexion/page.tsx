import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BoutonsOAuth } from './BoutonsOAuth';
import { FormulaireConnexionMdp } from './FormulaireConnexionMdp';
import { FormulaireMagicLink } from './FormulaireMagicLink';

export const metadata: Metadata = {
  title: 'Se connecter',
};

const FALLBACKS = {
  titre: 'Se connecter',
  intro: 'Quatre portes au choix.',
  erreurTitre: 'Connexion impossible',
  erreurCodeManquant: 'Le lien de connexion a expiré ou est incomplet. Recommence le flux.',
  sectionMdp: 'Mot de passe',
  motDePasseOublie: 'Mot de passe oublié ?',
  sectionMagic: 'Lien magique par email',
  hintMagic: "Pas besoin de mot de passe : on t'envoie un lien à usage unique.",
  sectionOauth: 'Comptes existants',
  bottomAmorce: 'Pas encore de compte ?',
  bottomLien: 'Créer un compte',
};

/**
 * Page de connexion : 4 portes empilées (cf. spec §9).
 *
 * Choix d'ergonomie : on affiche les 4 méthodes empilées plutôt que des
 * tabs, pour rendre l'éventail des options immédiatement visible
 * (transparence) et éviter de cacher des méthodes derrière des onglets.
 *
 * Le paramètre `?erreur=...` (envoyé par `app/auth/callback/route.ts`
 * en cas d'échec OAuth ou magic link) s'affiche en haut de page.
 */
export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  const [
    estAdmin,
    titre,
    intro,
    erreurTitre,
    erreurCodeManquant,
    sectionMdp,
    motDePasseOublie,
    sectionMagic,
    hintMagic,
    sectionOauth,
    bottomAmorce,
    bottomLien,
  ] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('connexion.titre', { valeurMd: FALLBACKS.titre }),
    lireContenuEditorial('connexion.intro', { valeurMd: FALLBACKS.intro }),
    lireContenuEditorial('connexion.erreur_titre', { valeurMd: FALLBACKS.erreurTitre }),
    lireContenuEditorial('connexion.erreur_code_manquant', {
      valeurMd: FALLBACKS.erreurCodeManquant,
    }),
    lireContenuEditorial('connexion.section.mdp', { valeurMd: FALLBACKS.sectionMdp }),
    lireContenuEditorial('connexion.mot_de_passe_oublie', {
      valeurMd: FALLBACKS.motDePasseOublie,
    }),
    lireContenuEditorial('connexion.section.magic', { valeurMd: FALLBACKS.sectionMagic }),
    lireContenuEditorial('connexion.hint.magic', { valeurMd: FALLBACKS.hintMagic }),
    lireContenuEditorial('connexion.section.oauth', { valeurMd: FALLBACKS.sectionOauth }),
    lireContenuEditorial('connexion.bottom.amorce', { valeurMd: FALLBACKS.bottomAmorce }),
    lireContenuEditorial('connexion.bottom.lien', { valeurMd: FALLBACKS.bottomLien }),
  ]);

  return (
    <article className="grid gap-6">
      <header>
        <TexteEditableAdmin
          cle="connexion.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre de la page connexion"
          longueurMax={60}
        >
          {(t) => <Heading niveau={1}>{t}</Heading>}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="connexion.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro de la page connexion"
          longueurMax={200}
        >
          {(t) => <p className="mt-2 text-text-2">{t}</p>}
        </TexteEditableAdmin>
      </header>

      {erreur !== undefined ? (
        <Alert
          variant="danger"
          titre={
            <TexteEditableAdmin
              cle="connexion.erreur_titre"
              valeurInitiale={erreurTitre.valeurMd}
              estAdmin={estAdmin}
              libelle="titre de l'alerte d'erreur connexion"
              longueurMax={60}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          }
        >
          {erreur === 'code-manquant' ? (
            <TexteEditableAdmin
              cle="connexion.erreur_code_manquant"
              valeurInitiale={erreurCodeManquant.valeurMd}
              estAdmin={estAdmin}
              libelle="message d'erreur 'code manquant'"
              multilignes
              longueurMax={300}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          ) : (
            erreur
          )}
        </Alert>
      ) : null}

      <Card variant="ombre">
        <TexteEditableAdmin
          cle="connexion.section.mdp"
          valeurInitiale={sectionMdp.valeurMd}
          estAdmin={estAdmin}
          libelle="titre section Mot de passe"
          longueurMax={50}
        >
          {(t) => (
            <Heading niveau={3} className="mb-3 text-lg">
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <FormulaireConnexionMdp />
        <p className="mt-3 text-sm">
          <TexteEditableAdmin
            cle="connexion.mot_de_passe_oublie"
            valeurInitiale={motDePasseOublie.valeurMd}
            estAdmin={estAdmin}
            libelle="libelle lien mot de passe oublie"
            longueurMax={60}
          >
            {(t) => (
              <Link
                href="/mot-de-passe-oublie"
                className="text-brand underline-offset-4 hover:underline"
              >
                {t}
              </Link>
            )}
          </TexteEditableAdmin>
        </p>
      </Card>

      <Card variant="ombre">
        <TexteEditableAdmin
          cle="connexion.section.magic"
          valeurInitiale={sectionMagic.valeurMd}
          estAdmin={estAdmin}
          libelle="titre section lien magique"
          longueurMax={50}
        >
          {(t) => (
            <Heading niveau={3} className="mb-3 text-lg">
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="connexion.hint.magic"
          valeurInitiale={hintMagic.valeurMd}
          estAdmin={estAdmin}
          libelle="hint section lien magique"
          multilignes
          longueurMax={200}
        >
          {(t) => <p className="mb-3 text-sm text-text-2">{t}</p>}
        </TexteEditableAdmin>
        <FormulaireMagicLink />
      </Card>

      <Card variant="ombre">
        <TexteEditableAdmin
          cle="connexion.section.oauth"
          valeurInitiale={sectionOauth.valeurMd}
          estAdmin={estAdmin}
          libelle="titre section comptes existants"
          longueurMax={50}
        >
          {(t) => (
            <Heading niveau={3} className="mb-3 text-lg">
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <BoutonsOAuth />
      </Card>

      <p className="text-sm text-text-3">
        <TexteEditableAdmin
          cle="connexion.bottom.amorce"
          valeurInitiale={bottomAmorce.valeurMd}
          estAdmin={estAdmin}
          libelle="amorce bas de page connexion"
          longueurMax={80}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>{' '}
        <TexteEditableAdmin
          cle="connexion.bottom.lien"
          valeurInitiale={bottomLien.valeurMd}
          estAdmin={estAdmin}
          libelle="libelle lien Creer un compte (bas page connexion)"
          longueurMax={40}
        >
          {(t) => (
            <Link href="/inscription" className="text-brand underline-offset-4 hover:underline">
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </p>
    </article>
  );
}
