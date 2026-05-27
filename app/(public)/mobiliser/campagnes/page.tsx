import { CarteCampagne } from '@/components/campagnes/CarteCampagne';
import { MarkdownLeger } from '@/components/contenu/MarkdownLeger';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { listerCampagnesPubliees } from '@/lib/campagnes/requetes';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Link from 'next/link';

const FALLBACKS = {
  intro:
    "Une campagne, c'est un assemblage thématique : une pétition + une mobilisation + une cagnotte + un sondage + une page éditoriale, autour d'un même combat. Modération avant publication.",
  ctaConnecte: 'Lancer une campagne',
  ctaDeconnecte: 'Connecte-toi pour lancer',
  emptyTitre: 'Aucune campagne publiée',
  emptyCorps:
    "Les premières campagnes Maintenant! apparaîtront ici. Tu peux être à l'origine de la première.",
  footer:
    "Les campagnes sont modérées **a priori**, avant publication, par l'équipe Maintenant!. Une fois la campagne validée, tu pourras y attacher tes modules (pétitions, mobilisations, etc.) depuis sa page.",
};

export const metadata: Metadata = {
  title: 'Campagnes',
  description:
    'Campagnes citoyennes (assemblages thématiques de pétitions, mobilisations, cagnottes, sondages).',
};

/**
 * Page liste des campagnes (`/mobiliser/campagnes`, chantier 3.2).
 *
 * Une campagne = un wrapper thématique qui assemble plusieurs modules
 * (pétition + mobilisation + cagnotte + sondage + page éditoriale).
 * Modération a priori (cf. spec §11).
 */
export default async function PageCampagnes() {
  const [
    campagnes,
    session,
    estAdmin,
    intro,
    ctaConnecte,
    ctaDeconnecte,
    emptyTitre,
    emptyCorps,
    footer,
  ] = await Promise.all([
    listerCampagnesPubliees(),
    getSession(),
    estAdminCourant(),
    lireContenuEditorial('mobiliser.campagnes.intro', { valeurMd: FALLBACKS.intro }),
    lireContenuEditorial('mobiliser.campagnes.cta_connecte', { valeurMd: FALLBACKS.ctaConnecte }),
    lireContenuEditorial('mobiliser.campagnes.cta_deconnecte', {
      valeurMd: FALLBACKS.ctaDeconnecte,
    }),
    lireContenuEditorial('mobiliser.campagnes.empty_titre', { valeurMd: FALLBACKS.emptyTitre }),
    lireContenuEditorial('mobiliser.campagnes.empty_corps', { valeurMd: FALLBACKS.emptyCorps }),
    lireContenuEditorial('mobiliser.campagnes.footer', { valeurMd: FALLBACKS.footer }),
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
            Campagnes
          </Heading>
          <TexteEditableAdmin
            cle="mobiliser.campagnes.intro"
            valeurInitiale={intro.valeurMd}
            estAdmin={estAdmin}
            libelle="intro de la liste campagnes"
            multilignes
            longueurMax={500}
          >
            {(t) => <p className="mt-3 max-w-2xl text-text-2">{t}</p>}
          </TexteEditableAdmin>
        </div>
        <TexteEditableAdmin
          cle={
            personneConnectee
              ? 'mobiliser.campagnes.cta_connecte'
              : 'mobiliser.campagnes.cta_deconnecte'
          }
          valeurInitiale={personneConnectee ? ctaConnecte.valeurMd : ctaDeconnecte.valeurMd}
          estAdmin={estAdmin}
          libelle={`CTA principal liste campagnes (${personneConnectee ? 'connecte' : 'deconnecte'})`}
          longueurMax={60}
        >
          {(t) => (
            <Link
              href="/mobiliser/campagnes/nouvelle"
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

      {campagnes.length === 0 ? (
        <Alert
          variant="info"
          titre={
            <TexteEditableAdmin
              cle="mobiliser.campagnes.empty_titre"
              valeurInitiale={emptyTitre.valeurMd}
              estAdmin={estAdmin}
              libelle="titre empty state campagnes"
              longueurMax={60}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          }
        >
          <TexteEditableAdmin
            cle="mobiliser.campagnes.empty_corps"
            valeurInitiale={emptyCorps.valeurMd}
            estAdmin={estAdmin}
            libelle="corps empty state campagnes"
            multilignes
            longueurMax={300}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </Alert>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campagnes.map((campagne, index) => (
            <li key={campagne.id}>
              <CarteCampagne campagne={campagne} enAvant={index === 0} />
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-12 border-t border-border pt-6 text-sm text-text-3">
        <TexteEditableAdmin
          cle="mobiliser.campagnes.footer"
          valeurInitiale={footer.valeurMd}
          estAdmin={estAdmin}
          libelle="note bas de page liste campagnes (Markdown leger)"
          multilignes
          longueurMax={400}
        >
          {(t) => <MarkdownLeger texte={t} />}
        </TexteEditableAdmin>
      </footer>
    </Container>
  );
}
