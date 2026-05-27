import { MarkdownLeger } from '@/components/contenu/MarkdownLeger';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { CartePetition } from '@/components/petitions/CartePetition';
import { Alert, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { listerPetitionsPubliees } from '@/lib/petitions/requetes';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pétitions',
  description:
    'Pétitions citoyennes en cours sur Maintenant!. Signer en quelques secondes, créer la tienne en quelques minutes.',
};

const FALLBACKS = {
  intro:
    'Toutes les pétitions citoyennes en cours sur Maintenant!. Chaque pétition est modérée avant publication. Signe en quelques secondes, ou lance la tienne.',
  ctaConnecte: 'Lancer une pétition',
  ctaDeconnecte: 'Connecte-toi pour lancer une pétition',
  emptyTitre: 'Aucune pétition active pour le moment',
  emptyCorps:
    "La première pétition publiée apparaîtra ici. Tu peux être à l'origine de cette première.",
  footer:
    "Les pétitions sont modérées **a priori**, avant publication, par l'équipe de Maintenant!. Le délai habituel de modération est de 24 à 48 heures.",
};

/**
 * Page liste des pétitions (`/mobiliser/petitions`, chantier 3.1).
 *
 * - Affiche toutes les pétitions publiées (`statut = 'publiee'`), tri
 *   par récence. Pas de pagination explicite tant que la masse reste
 *   raisonnable (cf. `listerPetitionsPubliees`, limite 50).
 * - Bouton « Lancer une pétition » visible toujours ; redirige vers
 *   `/connexion?prochaine=...` si la personne n'est pas connectée
 *   (gestion centralisée par la page `/mobiliser/petitions/nouvelle`).
 * - État vide propre quand aucune pétition n'est encore publiée :
 *   message explicatif + CTA création.
 */
export default async function PagePetitions() {
  const [
    petitions,
    session,
    estAdmin,
    intro,
    ctaConnecte,
    ctaDeconnecte,
    emptyTitre,
    emptyCorps,
    footer,
  ] = await Promise.all([
    listerPetitionsPubliees(),
    getSession(),
    estAdminCourant(),
    lireContenuEditorial('mobiliser.petitions.intro', { valeurMd: FALLBACKS.intro }),
    lireContenuEditorial('mobiliser.petitions.cta_connecte', { valeurMd: FALLBACKS.ctaConnecte }),
    lireContenuEditorial('mobiliser.petitions.cta_deconnecte', {
      valeurMd: FALLBACKS.ctaDeconnecte,
    }),
    lireContenuEditorial('mobiliser.petitions.empty_titre', { valeurMd: FALLBACKS.emptyTitre }),
    lireContenuEditorial('mobiliser.petitions.empty_corps', { valeurMd: FALLBACKS.emptyCorps }),
    lireContenuEditorial('mobiliser.petitions.footer', { valeurMd: FALLBACKS.footer }),
  ]);
  const personneConnectee = session !== null;

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">
            <Link href="/mobiliser" className="text-text-3 hover:text-brand">
              Mobiliser
            </Link>
          </p>
          <Heading niveau={1} className="mt-1">
            Pétitions
          </Heading>
          <TexteEditableAdmin
            cle="mobiliser.petitions.intro"
            valeurInitiale={intro.valeurMd}
            estAdmin={estAdmin}
            libelle="intro de la liste petitions"
            multilignes
            longueurMax={500}
          >
            {(t) => <p className="mt-3 max-w-2xl text-text-2">{t}</p>}
          </TexteEditableAdmin>
        </div>
        <TexteEditableAdmin
          cle={
            personneConnectee
              ? 'mobiliser.petitions.cta_connecte'
              : 'mobiliser.petitions.cta_deconnecte'
          }
          valeurInitiale={personneConnectee ? ctaConnecte.valeurMd : ctaDeconnecte.valeurMd}
          estAdmin={estAdmin}
          libelle={`CTA principal liste petitions (${personneConnectee ? 'connecte' : 'deconnecte'})`}
          longueurMax={60}
        >
          {(t) => (
            <Link
              href="/mobiliser/petitions/nouvelle"
              className={cn(
                'inline-flex h-11 items-center justify-center rounded-md bg-grad px-5',
                'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
              )}
            >
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </header>

      {petitions.length === 0 ? (
        <Alert
          variant="info"
          titre={
            <TexteEditableAdmin
              cle="mobiliser.petitions.empty_titre"
              valeurInitiale={emptyTitre.valeurMd}
              estAdmin={estAdmin}
              libelle="titre empty state petitions"
              longueurMax={80}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          }
        >
          <TexteEditableAdmin
            cle="mobiliser.petitions.empty_corps"
            valeurInitiale={emptyCorps.valeurMd}
            estAdmin={estAdmin}
            libelle="corps empty state petitions"
            multilignes
            longueurMax={300}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </Alert>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {petitions.map((petition, index) => (
            <li key={petition.id}>
              <CartePetition petition={petition} enAvant={index === 0} />
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-12 border-t border-border pt-6 text-sm text-text-3">
        <TexteEditableAdmin
          cle="mobiliser.petitions.footer"
          valeurInitiale={footer.valeurMd}
          estAdmin={estAdmin}
          libelle="note bas de page liste petitions (Markdown leger : **gras**)"
          multilignes
          longueurMax={400}
        >
          {(t) => <MarkdownLeger texte={t} />}
        </TexteEditableAdmin>
      </footer>
    </Container>
  );
}
