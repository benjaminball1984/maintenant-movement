import { CarteCagnotte } from '@/components/cagnottes/CarteCagnotte';
import { MarkdownLeger } from '@/components/contenu/MarkdownLeger';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { listerCagnottesPubliees } from '@/lib/cagnottes/requetes';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { cn } from '@/lib/utils';
import type { TypeCagnotte } from '@/types/database';
import type { Metadata } from 'next';
import Link from 'next/link';

const FALLBACKS = {
  intro:
    'Don en euros (frais 5 % absorbés par la donatrice, paiement sécurisé Stripe) ou en 99-coin (frais 0 %). 3 types : ouvertes, caisses de lutte, cotisations.',
  ctaConnecte: 'Créer une cagnotte',
  ctaDeconnecte: 'Connecte-toi pour créer',
  emptyTitre: 'Aucune cagnotte publiée',
  emptyToutes: 'La première cagnotte apparaîtra ici.',
  footer:
    "Modération **a posteriori** avec blocage en cas de comportement louche (lieu mensonger, projet non conforme, plainte). Les paiements sont sécurisés par Stripe. Les cagnottes « cotisations » sont créées par l'équipe nationale.",
};

export const metadata: Metadata = {
  title: 'Cagnottes solidaires',
  description:
    'Cagnottes Maintenant! : cagnottes ouvertes, caisses de lutte, cotisations. Don en euros (Stripe) ou en 99-coin.',
};

interface PageCagnottesProps {
  searchParams: Promise<{ type?: string }>;
}

const ONGLETS: Array<{ slug: TypeCagnotte | 'toutes'; libelle: string; href: string }> = [
  { slug: 'toutes', libelle: 'Toutes', href: '/mobiliser/cagnottes' },
  { slug: 'ouverte', libelle: 'Ouvertes', href: '/mobiliser/cagnottes?type=ouverte' },
  { slug: 'lutte', libelle: 'Caisses de lutte', href: '/mobiliser/cagnottes?type=lutte' },
  { slug: 'cotisation', libelle: 'Cotisations', href: '/mobiliser/cagnottes?type=cotisation' },
];

function estTypeValide(v: string | undefined): v is TypeCagnotte {
  return v === 'ouverte' || v === 'lutte' || v === 'cotisation';
}

/**
 * Liste des cagnottes avec 4 onglets (toutes + 3 types).
 *
 * Modération a posteriori : pas de file d'attente, les cagnottes
 * apparaissent immédiatement, l'équipe peut suspendre en cas de
 * comportement louche (cf. /admin/moderation/cagnottes).
 */
export default async function PageCagnottes({ searchParams }: PageCagnottesProps) {
  const { type } = await searchParams;
  const filtre = estTypeValide(type) ? type : undefined;

  const [
    cagnottes,
    session,
    estAdmin,
    intro,
    ctaConnecte,
    ctaDeconnecte,
    emptyTitre,
    emptyToutes,
    footer,
  ] = await Promise.all([
    listerCagnottesPubliees(filtre),
    getSession(),
    estAdminCourant(),
    lireContenuEditorial('mobiliser.cagnottes.intro', { valeurMd: FALLBACKS.intro }),
    lireContenuEditorial('mobiliser.cagnottes.cta_connecte', { valeurMd: FALLBACKS.ctaConnecte }),
    lireContenuEditorial('mobiliser.cagnottes.cta_deconnecte', {
      valeurMd: FALLBACKS.ctaDeconnecte,
    }),
    lireContenuEditorial('mobiliser.cagnottes.empty_titre', { valeurMd: FALLBACKS.emptyTitre }),
    lireContenuEditorial('mobiliser.cagnottes.empty_toutes', { valeurMd: FALLBACKS.emptyToutes }),
    lireContenuEditorial('mobiliser.cagnottes.footer', { valeurMd: FALLBACKS.footer }),
  ]);
  const personneConnectee = session !== null;

  const ongletActif = filtre ?? 'toutes';

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
            Cagnottes solidaires
          </Heading>
          <TexteEditableAdmin
            cle="mobiliser.cagnottes.intro"
            valeurInitiale={intro.valeurMd}
            estAdmin={estAdmin}
            libelle="intro de la liste cagnottes"
            multilignes
            longueurMax={500}
          >
            {(t) => <p className="mt-3 max-w-2xl text-text-2">{t}</p>}
          </TexteEditableAdmin>
        </div>
        <TexteEditableAdmin
          cle={
            personneConnectee
              ? 'mobiliser.cagnottes.cta_connecte'
              : 'mobiliser.cagnottes.cta_deconnecte'
          }
          valeurInitiale={personneConnectee ? ctaConnecte.valeurMd : ctaDeconnecte.valeurMd}
          estAdmin={estAdmin}
          libelle={`CTA principal liste cagnottes (${personneConnectee ? 'connecte' : 'deconnecte'})`}
          longueurMax={60}
        >
          {(t) => (
            <Link
              href="/mobiliser/cagnottes/nouvelle"
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

      <nav
        aria-label="Filtres par type"
        className="mb-8 flex flex-wrap gap-2 border-b border-border"
      >
        {ONGLETS.map((onglet) => (
          <Link
            key={onglet.slug}
            href={onglet.href}
            className={cn(
              'border-b-2 px-3 py-2 text-sm transition',
              ongletActif === onglet.slug
                ? 'border-brand text-brand'
                : 'border-transparent text-text-3 hover:text-text-1',
            )}
          >
            {onglet.libelle}
          </Link>
        ))}
      </nav>

      {cagnottes.length === 0 ? (
        <Alert
          variant="info"
          titre={
            <TexteEditableAdmin
              cle="mobiliser.cagnottes.empty_titre"
              valeurInitiale={emptyTitre.valeurMd}
              estAdmin={estAdmin}
              libelle="titre empty state cagnottes"
              longueurMax={60}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          }
        >
          {filtre === undefined ? (
            <TexteEditableAdmin
              cle="mobiliser.cagnottes.empty_toutes"
              valeurInitiale={emptyToutes.valeurMd}
              estAdmin={estAdmin}
              libelle="corps empty state cagnottes (toutes)"
              longueurMax={200}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          ) : (
            `Aucune cagnotte de type « ${filtre} » pour le moment.`
          )}
        </Alert>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cagnottes.map((cagnotte, index) => (
            <li key={cagnotte.id}>
              <CarteCagnotte cagnotte={cagnotte} enAvant={index === 0} />
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-12 border-t border-border pt-6 text-sm text-text-3">
        <TexteEditableAdmin
          cle="mobiliser.cagnottes.footer"
          valeurInitiale={footer.valeurMd}
          estAdmin={estAdmin}
          libelle="note bas de page liste cagnottes (Markdown leger)"
          multilignes
          longueurMax={400}
        >
          {(t) => <MarkdownLeger texte={t} />}
        </TexteEditableAdmin>
      </footer>
    </Container>
  );
}
