import { MarkdownLeger } from '@/components/contenu/MarkdownLeger';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Card, Container, Heading } from '@/components/ui';
import { adhesionActive } from '@/lib/adhesion/requetes';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Adhérer',
  description:
    'Adhérer à Maintenant! — 3 chemins (gratuit, 12 €, 12 99-coin). Page sobre, sans argumentaire pesant.',
};

const FALLBACKS = {
  intro:
    'On entre dans Maintenant!, on en sort, on revient. 3 chemins : **gratuit**, **12 €**, **12 99-coin**.',
  alertActiveTitre: 'Tu es déjà adhérent·e',
  cheminGratuitLabel: 'Chemin 1',
  cheminGratuitDescription:
    'Adhésion sans barrière financière. Toute personne intéressée peut entrer.',
  cheminEurosLabel: 'Chemin 2',
  cheminEurosDescription: 'Paiement par carte (Stripe). Soutient le fonctionnement du mouvement.',
  cheminT99cpLabel: 'Chemin 3',
  cheminT99cpDescription:
    'Transaction T99CP (Polygon). Pour les personnes déjà équipées en wallet.',
  renouvellementTitre: 'Renouvellement automatique',
  renouvellementCorps:
    "L'adhésion dure 365 jours. Un mail de rappel est envoyé à l'approche de l'échéance. Aucun prélèvement récurrent : on revient ici pour renouveler par le chemin de son choix.",
};

const FORMATEUR_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Page d'accueil Adhérer — 3 chemins en cartes.
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
    cheminGratuitLabel,
    cheminGratuitDescription,
    cheminEurosLabel,
    cheminEurosDescription,
    cheminT99cpLabel,
    cheminT99cpDescription,
    renouvellementTitre,
    renouvellementCorps,
  ] = await Promise.all([
    session !== null ? adhesionActive(session.userId) : Promise.resolve(null),
    estAdminCourant(),
    lireContenuEditorial('agir.adherer.intro', { valeurMd: FALLBACKS.intro }),
    lireContenuEditorial('agir.adherer.alert_active_titre', {
      valeurMd: FALLBACKS.alertActiveTitre,
    }),
    lireContenuEditorial('agir.adherer.chemin_gratuit.label', {
      valeurMd: FALLBACKS.cheminGratuitLabel,
    }),
    lireContenuEditorial('agir.adherer.chemin_gratuit.description', {
      valeurMd: FALLBACKS.cheminGratuitDescription,
    }),
    lireContenuEditorial('agir.adherer.chemin_euros.label', {
      valeurMd: FALLBACKS.cheminEurosLabel,
    }),
    lireContenuEditorial('agir.adherer.chemin_euros.description', {
      valeurMd: FALLBACKS.cheminEurosDescription,
    }),
    lireContenuEditorial('agir.adherer.chemin_t99cp.label', {
      valeurMd: FALLBACKS.cheminT99cpLabel,
    }),
    lireContenuEditorial('agir.adherer.chemin_t99cp.description', {
      valeurMd: FALLBACKS.cheminT99cpDescription,
    }),
    lireContenuEditorial('agir.adherer.renouvellement_titre', {
      valeurMd: FALLBACKS.renouvellementTitre,
    }),
    lireContenuEditorial('agir.adherer.renouvellement_corps', {
      valeurMd: FALLBACKS.renouvellementCorps,
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
          <strong>{FORMATEUR_DATE.format(new Date(adhesion.expire_le))}</strong> (chemin{' '}
          {libelleChemin(adhesion.chemin as 'gratuit' | 'euros' | 't99cp')}). Renouvelle quand tu
          veux ci-dessous.
        </Alert>
      ) : null}

      <ul className="mt-8 grid gap-6 sm:grid-cols-3">
        <li>
          <Link
            href="/agir/adherer/gratuit"
            className="block h-full transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Card variant="ombre" className="flex h-full flex-col gap-2">
              <TexteEditableAdmin
                cle="agir.adherer.chemin_gratuit.label"
                valeurInitiale={cheminGratuitLabel.valeurMd}
                estAdmin={estAdmin}
                libelle="label chemin gratuit"
                longueurMax={30}
              >
                {(t) => (
                  <p className="text-xs font-bold uppercase tracking-cap text-success">{t}</p>
                )}
              </TexteEditableAdmin>
              <Heading niveau={2} apparenceComme={3}>
                Gratuit
              </Heading>
              <TexteEditableAdmin
                cle="agir.adherer.chemin_gratuit.description"
                valeurInitiale={cheminGratuitDescription.valeurMd}
                estAdmin={estAdmin}
                libelle="description chemin gratuit"
                multilignes
                longueurMax={200}
              >
                {(t) => <p className="text-sm text-text-2">{t}</p>}
              </TexteEditableAdmin>
            </Card>
          </Link>
        </li>
        <li>
          <Link
            href="/agir/adherer/euros"
            className="block h-full transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Card variant="ombre" className="flex h-full flex-col gap-2">
              <TexteEditableAdmin
                cle="agir.adherer.chemin_euros.label"
                valeurInitiale={cheminEurosLabel.valeurMd}
                estAdmin={estAdmin}
                libelle="label chemin euros"
                longueurMax={30}
              >
                {(t) => <p className="text-xs font-bold uppercase tracking-cap text-brand">{t}</p>}
              </TexteEditableAdmin>
              <Heading niveau={2} apparenceComme={3}>
                12 €
              </Heading>
              <TexteEditableAdmin
                cle="agir.adherer.chemin_euros.description"
                valeurInitiale={cheminEurosDescription.valeurMd}
                estAdmin={estAdmin}
                libelle="description chemin euros"
                multilignes
                longueurMax={200}
              >
                {(t) => <p className="text-sm text-text-2">{t}</p>}
              </TexteEditableAdmin>
            </Card>
          </Link>
        </li>
        <li>
          <Link
            href="/agir/adherer/t99cp"
            className="block h-full transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Card variant="ombre" className="flex h-full flex-col gap-2">
              <TexteEditableAdmin
                cle="agir.adherer.chemin_t99cp.label"
                valeurInitiale={cheminT99cpLabel.valeurMd}
                estAdmin={estAdmin}
                libelle="label chemin t99cp"
                longueurMax={30}
              >
                {(t) => <p className="text-xs font-bold uppercase tracking-cap text-accent">{t}</p>}
              </TexteEditableAdmin>
              <Heading niveau={2} apparenceComme={3}>
                12 99-coin
              </Heading>
              <TexteEditableAdmin
                cle="agir.adherer.chemin_t99cp.description"
                valeurInitiale={cheminT99cpDescription.valeurMd}
                estAdmin={estAdmin}
                libelle="description chemin t99cp"
                multilignes
                longueurMax={200}
              >
                {(t) => <p className="text-sm text-text-2">{t}</p>}
              </TexteEditableAdmin>
            </Card>
          </Link>
        </li>
      </ul>

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

function libelleChemin(chemin: 'gratuit' | 'euros' | 't99cp'): string {
  if (chemin === 'gratuit') return 'gratuit';
  if (chemin === 'euros') return '12 €';
  return '12 99-coin';
}
