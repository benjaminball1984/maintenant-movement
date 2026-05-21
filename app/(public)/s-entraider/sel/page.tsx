import { CarteService } from '@/components/sel/CarteService';
import { Alert, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { listerServicesSel } from '@/lib/sel/requetes';
import { cn } from '@/lib/utils';
import type { CategorieServiceSel } from '@/types/database';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'SEL — Système d’échange local',
  description:
    'Reconnaître le temps de chacun·e, libérer du temps pour tous et toutes. Service entre particulier·ères, volontariat pour les collectifs. 1 minute = 1 99-coin.',
};

interface PageSelProps {
  searchParams: Promise<{ categorie?: string }>;
}

const ONGLETS: Array<{ slug: CategorieServiceSel | 'toutes'; libelle: string; href: string }> = [
  { slug: 'toutes', libelle: 'Tous', href: '/s-entraider/sel' },
  { slug: 'service', libelle: 'Services', href: '/s-entraider/sel?categorie=service' },
  { slug: 'volontariat', libelle: 'Volontariats', href: '/s-entraider/sel?categorie=volontariat' },
];

function estCategorieValide(v: string | undefined): v is CategorieServiceSel {
  return v === 'service' || v === 'volontariat';
}

export default async function PageSel({ searchParams }: PageSelProps) {
  const { categorie } = await searchParams;
  const filtre = estCategorieValide(categorie) ? categorie : undefined;
  const [services, session] = await Promise.all([listerServicesSel(filtre), getSession()]);
  const personneConnectee = session !== null;
  const ongletActif = filtre ?? 'toutes';

  return (
    <>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Heading niveau={1}>SEL — Système d'échange local</Heading>
          <p className="mt-3 max-w-2xl text-text-2">
            Reconnaître le temps de chacun·e, libérer du temps pour tous et toutes.{' '}
            <strong>1 minute = 1 99-coin</strong> crédité après la réalisation (modération 2 h).
          </p>
          <p className="mt-2 text-sm text-text-3">
            <strong>Service</strong> entre particulier·ères, <strong>Volontariat</strong> pour les
            collectifs. Vocabulaire fixé : on ne dit pas « travail ».
          </p>
        </div>
        <Link
          href="/s-entraider/sel/nouveau"
          className={cn(
            'inline-flex h-11 items-center justify-center rounded-md bg-grad px-5',
            'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
          )}
        >
          {personneConnectee ? 'Publier un service' : 'Connecte-toi pour publier'}
        </Link>
      </header>

      <nav aria-label="Catégories" className="mb-8 flex flex-wrap gap-2 border-b border-border">
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

      {services.length === 0 ? (
        <Alert variant="info" titre="Aucun service publié pour le moment">
          Tu peux en publier un. Au moindre service réalisé, des 99-coin atterrissent dans le
          wallet.
        </Alert>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <li key={service.id}>
              <CarteService service={service} enAvant={index === 0} />
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-12 border-t border-border pt-6 text-sm text-text-3">
        <p>
          Modération à 2 h après la déclaration de réalisation : 120 minutes = 120 99-coins crédités
          automatiquement. La bénéficiaire peut contester pendant ce délai.
        </p>
      </footer>
    </>
  );
}
