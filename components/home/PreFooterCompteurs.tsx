import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Card } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';

interface PreFooterCompteursProps {
  /** Inscrit·es newsletter : signataires ayant coché opt-in plateforme. */
  newsletter: number;
  /** Comptes actifs sur le site (adhérent·es + sympathisant·es). */
  membres: number;
  /** Signataires de pétitions (total, incluant les 17 746 importés Base44). */
  signataires: number;
}

const FALLBACK_NEWSLETTER = 'Newsletter';
const FALLBACK_MEMBRES = 'Membres';
const FALLBACK_SIGNATAIRES = 'Signataires';

/**
 * Bande de 3 compteurs en pré-footer (cf. spec §3).
 *
 * Affiche les chiffres réels du mouvement : membres (count personne
 * actif), signataires (count signature_petition), newsletter (count
 * signature_petition where accepte_newsletter = true).
 *
 * Les 3 libelles sont editables admin via CMS (cles `home.compteur.*`).
 * Les CHIFFRES restent calcules en base (cf. getCompteursHome).
 */
export async function PreFooterCompteurs({
  newsletter,
  membres,
  signataires,
}: PreFooterCompteursProps) {
  const [estAdmin, libNewsletter, libMembres, libSignataires] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('home.compteur.newsletter', { valeurMd: FALLBACK_NEWSLETTER }),
    lireContenuEditorial('home.compteur.membres', { valeurMd: FALLBACK_MEMBRES }),
    lireContenuEditorial('home.compteur.signataires', { valeurMd: FALLBACK_SIGNATAIRES }),
  ]);

  return (
    <section aria-label="Compteurs du mouvement" className="border-y border-border bg-surface-2">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:px-8">
        <CompteurCarte
          cle="home.compteur.newsletter"
          libelle={libNewsletter.valeurMd}
          valeur={newsletter}
          estAdmin={estAdmin}
        />
        <CompteurCarte
          cle="home.compteur.membres"
          libelle={libMembres.valeurMd}
          valeur={membres}
          estAdmin={estAdmin}
        />
        <CompteurCarte
          cle="home.compteur.signataires"
          libelle={libSignataires.valeurMd}
          valeur={signataires}
          estAdmin={estAdmin}
        />
      </div>
    </section>
  );
}

function CompteurCarte({
  cle,
  libelle,
  valeur,
  estAdmin,
}: {
  cle: string;
  libelle: string;
  valeur: number;
  estAdmin: boolean;
}) {
  return (
    <Card variant="plat" className="text-center">
      <TexteEditableAdmin
        cle={cle}
        valeurInitiale={libelle}
        estAdmin={estAdmin}
        libelle={`libelle du compteur ${cle}`}
        longueurMax={40}
      >
        {(t) => <p className="text-xs font-bold uppercase tracking-cap text-text-3">{t}</p>}
      </TexteEditableAdmin>
      <p className="mt-1 font-display text-4xl font-bold text-text-1">
        {new Intl.NumberFormat('fr-FR').format(valeur)}
      </p>
    </Card>
  );
}
