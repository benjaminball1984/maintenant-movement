import { MarkdownLeger } from '@/components/contenu/MarkdownLeger';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Card, Container, Heading } from '@/components/ui';
import { adhesionActive } from '@/lib/adhesion/requetes';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Adhérer',
  description: 'Adhérer à Maintenant! : une adhésion, gratuite, sans barrière financière.',
};

const FALLBACKS = {
  intro: 'On entre dans Maintenant!, on en sort, on revient. L’adhésion est **gratuite**.',
  alertActiveTitre: 'Tu es déjà adhérent·e',
  adhesionTitre: 'Adhésion gratuite',
  adhesionDescription: 'Adhésion sans barrière financière. Toute personne intéressée peut entrer.',
  cta: 'Adhérer',
  renouvellementTitre: 'Renouvellement automatique',
  renouvellementCorps:
    "L'adhésion dure 365 jours. Un mail de rappel est envoyé à l'approche de l'échéance. Aucun prélèvement récurrent : on revient ici pour renouveler.",
};

const FORMATEUR_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Page Adhérer : une seule adhésion, gratuite.
 *
 * Histoire de cette page : elle a d'abord proposé **trois chemins**
 * d'adhésion (gratuit, 12 €, 12 99-coin), puis deux (le 99-coin est parti
 * le 01/08/2026). Décision de Lilou/Ben du 15/08/2026 : **on supprime
 * l'idée même de chemins**. Une personne qui veut adhérer ne doit pas
 * avoir à choisir une formule : elle adhère, point. L'adhésion est
 * gratuite pour tout le monde.
 *
 * Le soutien financier ne disparaît pas du site pour autant : il passe
 * par les dons et les cagnottes, qui sont des gestes distincts de
 * l'adhésion. Les parcours de paiement `/agir/adherer/euros` et
 * `/agir/adherer/t99cp` existent toujours dans le code mais sont mis en
 * sommeil (`config/rubriques.ts`), conformément à la doctrine de greffe
 * (CLAUDE.md §0.3 : on éteint, on ne supprime pas). Les adhésions déjà
 * payées restent valides et s'affichent normalement ci-dessous.
 *
 * Cf. spec §7A : « Page sobre, doctrine ouverte. Pas d'argumentaire
 * pesant : on entre dans le mouvement, on en sort, on revient. »
 *
 * Si la personne est déjà adhérente : on lui dit, avec sa date
 * d'expiration et un bouton pour renouveler.
 */
export default async function PageAdherer() {
  const session = await getSession();
  const [
    adhesion,
    estAdmin,
    intro,
    alertActiveTitre,
    adhesionTitre,
    adhesionDescription,
    renouvellementTitre,
    renouvellementCorps,
    cta,
  ] = await Promise.all([
    session !== null ? adhesionActive(session.userId) : Promise.resolve(null),
    estAdminCourant(),
    lireContenuEditorial('agir.adherer.intro', { valeurMd: FALLBACKS.intro }),
    lireContenuEditorial('agir.adherer.alert_active_titre', {
      valeurMd: FALLBACKS.alertActiveTitre,
    }),
    lireContenuEditorial('agir.adherer.adhesion_titre', {
      valeurMd: FALLBACKS.adhesionTitre,
    }),
    lireContenuEditorial('agir.adherer.adhesion_description', {
      valeurMd: FALLBACKS.adhesionDescription,
    }),
    lireContenuEditorial('agir.adherer.renouvellement_titre', {
      valeurMd: FALLBACKS.renouvellementTitre,
    }),
    lireContenuEditorial('agir.adherer.renouvellement_corps', {
      valeurMd: FALLBACKS.renouvellementCorps,
    }),
    lireContenuEditorial('agir.adherer.cta', {
      valeurMd: FALLBACKS.cta,
    }),
  ]);

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Image
          src="/logo/maintenant.png"
          alt="Logo Maintenant! (poing levé et coquelicot)"
          width={96}
          height={107}
          priority
          className="h-auto w-20 shrink-0 sm:w-24"
        />
        <div>
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">Agir</p>
          <Heading niveau={1}>Adhérer</Heading>
          <TexteEditableAdmin
            cle="agir.adherer.intro"
            valeurInitiale={intro.valeurMd}
            estAdmin={estAdmin}
            libelle="intro page adherer (Markdown leger : **gras**)"
            multilignes
            longueurMax={500}
          >
            {(t) => (
              <div className="mt-3 max-w-2xl text-text-2">
                <MarkdownLeger texte={t} />
              </div>
            )}
          </TexteEditableAdmin>
        </div>
      </header>

      {adhesion !== null && adhesion.expire_le !== null && adhesion.chemin !== null ? (
        <Alert
          variant="success"
          titre={
            <TexteEditableAdmin
              cle="agir.adherer.alert_active_titre"
              valeurInitiale={alertActiveTitre.valeurMd}
              estAdmin={estAdmin}
              libelle="titre alerte deja adherent"
              longueurMax={60}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          }
        >
          Ton adhésion est active jusqu'au{' '}
          <strong>{FORMATEUR_DATE.format(new Date(adhesion.expire_le))}</strong>
          {/* Les adhésions payées avant le passage au tout-gratuit gardent
              la mention de ce qui a été réglé : elle disparaît d'elle-même
              pour les adhésions gratuites. */}
          {mentionAncienneFormule(adhesion.chemin)}. Renouvelle quand tu veux ci-dessous.
        </Alert>
      ) : null}

      {/* Une seule entrée, donc pas de grille de comparaison : un bloc, un
          bouton. Rien à choisir, rien à comparer. */}
      <Card variant="ombre" className="mt-8 grid gap-3">
        <TexteEditableAdmin
          cle="agir.adherer.adhesion_titre"
          valeurInitiale={adhesionTitre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre du bloc adhesion"
          longueurMax={60}
        >
          {(t) => (
            <Heading niveau={2} apparenceComme={3}>
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="agir.adherer.adhesion_description"
          valeurInitiale={adhesionDescription.valeurMd}
          estAdmin={estAdmin}
          libelle="description du bloc adhesion"
          multilignes
          longueurMax={300}
        >
          {(t) => <p className="max-w-2xl text-text-2">{t}</p>}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="agir.adherer.cta"
          valeurInitiale={cta.valeurMd}
          estAdmin={estAdmin}
          libelle="libelle du bouton Adherer"
          longueurMax={60}
        >
          {(t) => (
            <Link
              href="/agir/adherer/gratuit"
              className={cn(
                'mt-2 inline-flex h-11 w-fit items-center justify-center rounded-md bg-grad px-6',
                'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
              )}
            >
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </Card>

      <section className="mt-12 grid gap-3 rounded-md border border-border bg-surface-2 p-6 text-sm text-text-2">
        <TexteEditableAdmin
          cle="agir.adherer.renouvellement_titre"
          valeurInitiale={renouvellementTitre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre section renouvellement"
          longueurMax={60}
        >
          {(t) => (
            <Heading niveau={2} apparenceComme={4}>
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="agir.adherer.renouvellement_corps"
          valeurInitiale={renouvellementCorps.valeurMd}
          estAdmin={estAdmin}
          libelle="corps section renouvellement"
          multilignes
          longueurMax={400}
        >
          {(t) => <p>{t}</p>}
        </TexteEditableAdmin>
      </section>
    </Container>
  );
}

/**
 * Rappelle la formule d'une adhésion souscrite AVANT le passage à
 * l'adhésion unique et gratuite (15/08/2026).
 *
 * Retourne une chaîne vide pour une adhésion gratuite : il n'y a plus
 * qu'une formule, la nommer n'apprendrait rien. Pour les adhésions payées
 * (12 € ou 12 99-coin), on garde la mention : la personne a versé quelque
 * chose, l'effacer de son écran serait malhonnête.
 */
function mentionAncienneFormule(chemin: string): string {
  if (chemin === 'euros') return ' (adhésion à 12 €)';
  if (chemin === 't99cp') return ' (adhésion à 12 99-coin)';
  return '';
}
