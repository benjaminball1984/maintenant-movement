import { MarkdownLeger } from '@/components/contenu/MarkdownLeger';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { CarteService } from '@/components/sel/CarteService';
import { Alert, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { listerServicesSel } from '@/lib/sel/requetes';
import { cn } from '@/lib/utils';
import type { CategorieServiceSel } from '@/types/database';
import type { Metadata } from 'next';
import Link from 'next/link';

const FALLBACKS = {
  intro:
    'Reconnaître le temps de chacun·e, libérer du temps pour tous et toutes. **1 minute = 1 99-coin** crédité après la réalisation (modération 2 h).',
  introSousLigne:
    '**Service** entre particulier·ères, **Volontariat** pour les collectifs. Vocabulaire fixé : on ne dit pas « travail ».',
  ctaConnecte: 'Publier un service',
  ctaDeconnecte: 'Connecte-toi pour publier',
  ongletTous: 'Tous',
  ongletService: 'Services',
  ongletVolontariat: 'Volontariats',
  emptyTitre: 'Aucun service publié pour le moment',
  emptyCorps:
    'Tu peux en publier un. Au moindre service réalisé, des 99-coin atterrissent dans le wallet.',
  footer:
    'Modération à 2 h après la déclaration de réalisation : 120 minutes = 120 99-coins crédités automatiquement. La bénéficiaire peut contester pendant ce délai.',
};

export const metadata: Metadata = {
  title: 'SEL — Système d’échange local',
  description:
    'Reconnaître le temps de chacun·e, libérer du temps pour tous et toutes. Service entre particulier·ères, volontariat pour les collectifs. 1 minute = 1 99-coin.',
};

interface PageSelProps {
  searchParams: Promise<{ categorie?: string }>;
}

interface ConfigOnglet {
  slug: CategorieServiceSel | 'toutes';
  cleCms: string;
  fallback: string;
  href: string;
}

const ONGLETS_CONFIG: ReadonlyArray<ConfigOnglet> = [
  {
    slug: 'toutes',
    cleCms: 's-entraider.sel.onglet_tous',
    fallback: FALLBACKS.ongletTous,
    href: '/s-entraider/sel',
  },
  {
    slug: 'service',
    cleCms: 's-entraider.sel.onglet_service',
    fallback: FALLBACKS.ongletService,
    href: '/s-entraider/sel?categorie=service',
  },
  {
    slug: 'volontariat',
    cleCms: 's-entraider.sel.onglet_volontariat',
    fallback: FALLBACKS.ongletVolontariat,
    href: '/s-entraider/sel?categorie=volontariat',
  },
];

function estCategorieValide(v: string | undefined): v is CategorieServiceSel {
  return v === 'service' || v === 'volontariat';
}

export default async function PageSel({ searchParams }: PageSelProps) {
  const { categorie } = await searchParams;
  const filtre = estCategorieValide(categorie) ? categorie : undefined;
  const [
    services,
    session,
    estAdmin,
    intro,
    introSousLigne,
    ctaConnecte,
    ctaDeconnecte,
    emptyTitre,
    emptyCorps,
    footer,
    ...ongletsLus
  ] = await Promise.all([
    listerServicesSel(filtre),
    getSession(),
    estAdminCourant(),
    lireContenuEditorial('s-entraider.sel.intro', { valeurMd: FALLBACKS.intro }),
    lireContenuEditorial('s-entraider.sel.intro_sous_ligne', {
      valeurMd: FALLBACKS.introSousLigne,
    }),
    lireContenuEditorial('s-entraider.sel.cta_connecte', { valeurMd: FALLBACKS.ctaConnecte }),
    lireContenuEditorial('s-entraider.sel.cta_deconnecte', {
      valeurMd: FALLBACKS.ctaDeconnecte,
    }),
    lireContenuEditorial('s-entraider.sel.empty_titre', { valeurMd: FALLBACKS.emptyTitre }),
    lireContenuEditorial('s-entraider.sel.empty_corps', { valeurMd: FALLBACKS.emptyCorps }),
    lireContenuEditorial('s-entraider.sel.footer', { valeurMd: FALLBACKS.footer }),
    ...ONGLETS_CONFIG.map((o) => lireContenuEditorial(o.cleCms, { valeurMd: o.fallback })),
  ]);
  const personneConnectee = session !== null;
  const ongletActif = filtre ?? 'toutes';

  return (
    <>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Heading niveau={1}>SEL — Système d'échange local</Heading>
          <TexteEditableAdmin
            cle="s-entraider.sel.intro"
            valeurInitiale={intro.valeurMd}
            estAdmin={estAdmin}
            libelle="intro SEL (Markdown leger : **gras**)"
            multilignes
            longueurMax={400}
          >
            {(t) => (
              <div className="mt-3 max-w-2xl text-text-2">
                <MarkdownLeger texte={t} />
              </div>
            )}
          </TexteEditableAdmin>
          <TexteEditableAdmin
            cle="s-entraider.sel.intro_sous_ligne"
            valeurInitiale={introSousLigne.valeurMd}
            estAdmin={estAdmin}
            libelle="sous-ligne intro SEL (Markdown leger : **gras**)"
            multilignes
            longueurMax={300}
          >
            {(t) => (
              <div className="mt-2 text-sm text-text-3">
                <MarkdownLeger texte={t} />
              </div>
            )}
          </TexteEditableAdmin>
        </div>
        <TexteEditableAdmin
          cle={
            personneConnectee ? 's-entraider.sel.cta_connecte' : 's-entraider.sel.cta_deconnecte'
          }
          valeurInitiale={personneConnectee ? ctaConnecte.valeurMd : ctaDeconnecte.valeurMd}
          estAdmin={estAdmin}
          libelle={`CTA SEL (${personneConnectee ? 'connecte' : 'deconnecte'})`}
          longueurMax={60}
        >
          {(t) => (
            <Link
              href="/s-entraider/sel/nouveau"
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

      <nav aria-label="Catégories" className="mb-8 flex flex-wrap gap-2 border-b border-border">
        {ONGLETS_CONFIG.map((onglet, i) => (
          <TexteEditableAdmin
            key={onglet.slug}
            cle={onglet.cleCms}
            valeurInitiale={ongletsLus[i]?.valeurMd ?? onglet.fallback}
            estAdmin={estAdmin}
            libelle={`onglet ${onglet.slug}`}
            longueurMax={30}
          >
            {(t) => (
              <Link
                href={onglet.href}
                className={cn(
                  'border-b-2 px-3 py-2 text-sm transition',
                  ongletActif === onglet.slug
                    ? 'border-brand text-brand'
                    : 'border-transparent text-text-3 hover:text-text-1',
                )}
              >
                {t}
              </Link>
            )}
          </TexteEditableAdmin>
        ))}
      </nav>

      {services.length === 0 ? (
        <Alert
          variant="info"
          titre={
            <TexteEditableAdmin
              cle="s-entraider.sel.empty_titre"
              valeurInitiale={emptyTitre.valeurMd}
              estAdmin={estAdmin}
              libelle="titre empty state SEL"
              longueurMax={80}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          }
        >
          <TexteEditableAdmin
            cle="s-entraider.sel.empty_corps"
            valeurInitiale={emptyCorps.valeurMd}
            estAdmin={estAdmin}
            libelle="corps empty state SEL"
            multilignes
            longueurMax={300}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </Alert>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {services.map((service, index) => (
            <li key={service.id}>
              <CarteService service={service} enAvant={index === 0} />
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-12 border-t border-border pt-6 text-sm text-text-3">
        <TexteEditableAdmin
          cle="s-entraider.sel.footer"
          valeurInitiale={footer.valeurMd}
          estAdmin={estAdmin}
          libelle="footer SEL"
          multilignes
          longueurMax={400}
        >
          {(t) => <p>{t}</p>}
        </TexteEditableAdmin>
      </footer>
    </>
  );
}
