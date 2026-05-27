import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getPersonneOuRediriger } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FormulaireEnrollementTotp } from './FormulaireEnrollementTotp';

export const metadata: Metadata = {
  title: 'Activer la 2FA',
};

/**
 * Setup TOTP : scan d'un QR code + saisie du code à 6 chiffres.
 *
 * À la fin du flux, redirige vers `/profil/confidentialite?2fa=active`
 * qui affiche le message de succès dans la section dédiée.
 */
export default async function PageDeuxFA() {
  await getPersonneOuRediriger('/profil/securite/2fa');
  const [estAdmin, titre, intro, retourLien] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('profil.2fa.titre', { valeurMd: 'Activer la 2FA' }),
    lireContenuEditorial('profil.2fa.intro', {
      valeurMd:
        'Un code temporaire à 6 chiffres en plus de ton mot de passe, généré par une app d’authentification.',
    }),
    lireContenuEditorial('profil.2fa.retour_lien', { valeurMd: 'Retour à Confidentialité' }),
  ]);

  return (
    <article className="grid gap-6">
      <header>
        <TexteEditableAdmin
          cle="profil.2fa.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre page 2FA"
          longueurMax={40}
        >
          {(t) => <Heading niveau={1}>{t}</Heading>}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="profil.2fa.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro page 2FA"
          multilignes
          longueurMax={300}
        >
          {(t) => <p className="mt-2 text-text-2">{t}</p>}
        </TexteEditableAdmin>
        <p className="mt-1 text-sm text-text-3">
          <TexteEditableAdmin
            cle="profil.2fa.retour_lien"
            valeurInitiale={retourLien.valeurMd}
            estAdmin={estAdmin}
            libelle="lien retour vers Confidentialite"
            longueurMax={50}
          >
            {(t) => (
              <Link
                href="/profil/confidentialite"
                className="text-brand underline-offset-4 hover:underline"
              >
                {t}
              </Link>
            )}
          </TexteEditableAdmin>
        </p>
      </header>

      <Card variant="ombre">
        <FormulaireEnrollementTotp />
      </Card>
    </article>
  );
}
