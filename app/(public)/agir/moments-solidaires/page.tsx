import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { CarteMomentSolidaire } from '@/components/moments/CarteMomentSolidaire';
import { Alert, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { LISTE_TYPES_MOMENTS, TYPES_MOMENTS } from '@/lib/moments/config';
import { listerMomentsSolidaires } from '@/lib/moments/requetes';
import { cn } from '@/lib/utils';
import type { TypeMomentSolidaire } from '@/types/database';
import type { Metadata } from 'next';
import Link from 'next/link';

const FALLBACKS = {
  intro:
    'Mouvement de service au service de nous-mêmes. Auto-éducation populaire, auto-solidarité. 8 types, dont le porte-à-porte solidaire en 7 RDV automatiques. Cf. doctrine §7C.',
  ctaConnecte: 'Organiser un moment',
  ctaDeconnecte: 'Connecte-toi pour organiser',
  ongletTous: 'Tous',
  emptyTitre: 'Aucun moment programmé',
  emptyCorps:
    "Organise le premier. Le porte-à-porte solidaire crée automatiquement 7 RDV enfants à partir d'une date de début.",
};

export const metadata: Metadata = {
  title: 'Moments solidaires',
  description:
    'Porte-à-porte solidaire, maraudes, vide-greniers, soutiens, manifestations, rencontres, concerts, repas solidaires.',
};

interface PageMomentsProps {
  searchParams: Promise<{ type?: string }>;
}

function estTypeValide(v: string | undefined): v is TypeMomentSolidaire {
  return v !== undefined && v in TYPES_MOMENTS;
}

export default async function PageMomentsSolidaires({ searchParams }: PageMomentsProps) {
  const { type } = await searchParams;
  const filtre = estTypeValide(type) ? type : undefined;
  const [
    moments,
    session,
    estAdmin,
    intro,
    ctaConnecte,
    ctaDeconnecte,
    ongletTous,
    emptyTitre,
    emptyCorps,
  ] = await Promise.all([
    listerMomentsSolidaires({ type: filtre, parentsSeulement: true }),
    getSession(),
    estAdminCourant(),
    lireContenuEditorial('agir.moments.intro', { valeurMd: FALLBACKS.intro }),
    lireContenuEditorial('agir.moments.cta_connecte', { valeurMd: FALLBACKS.ctaConnecte }),
    lireContenuEditorial('agir.moments.cta_deconnecte', { valeurMd: FALLBACKS.ctaDeconnecte }),
    lireContenuEditorial('agir.moments.onglet_tous', { valeurMd: FALLBACKS.ongletTous }),
    lireContenuEditorial('agir.moments.empty_titre', { valeurMd: FALLBACKS.emptyTitre }),
    lireContenuEditorial('agir.moments.empty_corps', { valeurMd: FALLBACKS.emptyCorps }),
  ]);
  const personneConnectee = session !== null;
  const ongletActif = filtre ?? 'tous';

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">Agir</p>
          <Heading niveau={1}>Moments solidaires</Heading>
          <TexteEditableAdmin
            cle="agir.moments.intro"
            valeurInitiale={intro.valeurMd}
            estAdmin={estAdmin}
            libelle="intro page moments solidaires"
            multilignes
            longueurMax={500}
          >
            {(t) => <p className="mt-3 max-w-2xl text-text-2">{t}</p>}
          </TexteEditableAdmin>
        </div>
        <TexteEditableAdmin
          cle={personneConnectee ? 'agir.moments.cta_connecte' : 'agir.moments.cta_deconnecte'}
          valeurInitiale={personneConnectee ? ctaConnecte.valeurMd : ctaDeconnecte.valeurMd}
          estAdmin={estAdmin}
          libelle={`CTA moments (${personneConnectee ? 'connecte' : 'deconnecte'})`}
          longueurMax={60}
        >
          {(t) => (
            <Link
              href="/agir/moments-solidaires/nouveau"
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

      <nav aria-label="Type de moment" className="mb-8 flex flex-wrap gap-2 border-b border-border">
        <TexteEditableAdmin
          cle="agir.moments.onglet_tous"
          valeurInitiale={ongletTous.valeurMd}
          estAdmin={estAdmin}
          libelle="onglet Tous"
          longueurMax={20}
        >
          {(t) => (
            <Link
              href="/agir/moments-solidaires"
              className={
                ongletActif === 'tous'
                  ? 'border-b-2 border-brand px-3 py-2 text-sm text-brand'
                  : 'border-b-2 border-transparent px-3 py-2 text-sm text-text-3 hover:text-text-1'
              }
            >
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
        {LISTE_TYPES_MOMENTS.map((t) => (
          <Link
            key={t.type}
            href={`/agir/moments-solidaires?type=${t.type}`}
            className={
              ongletActif === t.type
                ? 'border-b-2 border-brand px-3 py-2 text-sm text-brand'
                : 'border-b-2 border-transparent px-3 py-2 text-sm text-text-3 hover:text-text-1'
            }
          >
            {t.libelle}
          </Link>
        ))}
      </nav>

      {moments.length === 0 ? (
        <Alert
          variant="info"
          titre={
            <TexteEditableAdmin
              cle="agir.moments.empty_titre"
              valeurInitiale={emptyTitre.valeurMd}
              estAdmin={estAdmin}
              libelle="titre empty state moments"
              longueurMax={60}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          }
        >
          <TexteEditableAdmin
            cle="agir.moments.empty_corps"
            valeurInitiale={emptyCorps.valeurMd}
            estAdmin={estAdmin}
            libelle="corps empty state moments"
            multilignes
            longueurMax={300}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </Alert>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {moments.map((moment, index) => (
            <li key={moment.id}>
              <CarteMomentSolidaire moment={moment} enAvant={index === 0} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
