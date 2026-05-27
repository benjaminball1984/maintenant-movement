import { CarteCommune } from '@/components/communes/CarteCommune';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { listerCommunes } from '@/lib/communes/requetes';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Link from 'next/link';

const FALLBACKS = {
  intro:
    'On part du réel et on ne part pas de coquille vide. Maximum 3 communes par personne ; anti-spam une transition par mois.',
  ctaConnecte: 'Créer une commune libre',
  ctaDeconnecte: 'Connecte-toi pour créer',
  recherchePlaceholder: 'Rechercher une commune par nom',
  emptyTitre: 'Aucune commune trouvée',
  emptyCorps: 'Élargis la recherche ou crée une commune libre.',
  niveauxTitre: 'Trois niveaux supra-locaux',
};

export const metadata: Metadata = {
  title: 'Communes libres',
  description:
    'Communes du mouvement Maintenant! — territoriales ou libres. On part du réel, on ne part pas de coquille vide.',
};

interface PageCommunesProps {
  searchParams: Promise<{ recherche?: string }>;
}

export default async function PageCommunes({ searchParams }: PageCommunesProps) {
  const { recherche } = await searchParams;
  const [
    communes,
    session,
    estAdmin,
    intro,
    ctaConnecte,
    ctaDeconnecte,
    recherchePlaceholder,
    emptyTitre,
    emptyCorps,
    niveauxTitre,
  ] = await Promise.all([
    listerCommunes(recherche),
    getSession(),
    estAdminCourant(),
    lireContenuEditorial('agir.communes.intro', { valeurMd: FALLBACKS.intro }),
    lireContenuEditorial('agir.communes.cta_connecte', { valeurMd: FALLBACKS.ctaConnecte }),
    lireContenuEditorial('agir.communes.cta_deconnecte', { valeurMd: FALLBACKS.ctaDeconnecte }),
    lireContenuEditorial('agir.communes.recherche_placeholder', {
      valeurMd: FALLBACKS.recherchePlaceholder,
    }),
    lireContenuEditorial('agir.communes.empty_titre', { valeurMd: FALLBACKS.emptyTitre }),
    lireContenuEditorial('agir.communes.empty_corps', { valeurMd: FALLBACKS.emptyCorps }),
    lireContenuEditorial('agir.communes.niveaux_titre', { valeurMd: FALLBACKS.niveauxTitre }),
  ]);
  const personneConnectee = session !== null;

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">Agir</p>
          <Heading niveau={1}>Communes libres</Heading>
          <TexteEditableAdmin
            cle="agir.communes.intro"
            valeurInitiale={intro.valeurMd}
            estAdmin={estAdmin}
            libelle="intro page communes"
            multilignes
            longueurMax={400}
          >
            {(t) => <p className="mt-3 max-w-2xl text-text-2">{t}</p>}
          </TexteEditableAdmin>
        </div>
        <TexteEditableAdmin
          cle={personneConnectee ? 'agir.communes.cta_connecte' : 'agir.communes.cta_deconnecte'}
          valeurInitiale={personneConnectee ? ctaConnecte.valeurMd : ctaDeconnecte.valeurMd}
          estAdmin={estAdmin}
          libelle={`CTA principal communes (${personneConnectee ? 'connecte' : 'deconnecte'})`}
          longueurMax={60}
        >
          {(t) => (
            <Link
              href="/agir/communes/nouvelle"
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

      <form method="get" className="mb-8 flex gap-2">
        <input
          type="search"
          name="recherche"
          placeholder={recherchePlaceholder.valeurMd}
          defaultValue={recherche ?? ''}
          className="w-full rounded-sm border border-border bg-surface p-2 text-sm"
        />
      </form>

      {communes.length === 0 ? (
        <Alert
          variant="info"
          titre={
            <TexteEditableAdmin
              cle="agir.communes.empty_titre"
              valeurInitiale={emptyTitre.valeurMd}
              estAdmin={estAdmin}
              libelle="titre empty state communes"
              longueurMax={60}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          }
        >
          <TexteEditableAdmin
            cle="agir.communes.empty_corps"
            valeurInitiale={emptyCorps.valeurMd}
            estAdmin={estAdmin}
            libelle="corps empty state communes"
            longueurMax={200}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </Alert>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {communes.map((c) => (
            <li key={c.id}>
              <CarteCommune commune={c} />
            </li>
          ))}
        </ul>
      )}

      <section className="mt-12 grid gap-2 rounded-md border border-border bg-surface-2 p-6 text-sm text-text-2">
        <TexteEditableAdmin
          cle="agir.communes.niveaux_titre"
          valeurInitiale={niveauxTitre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre section trois niveaux"
          longueurMax={60}
        >
          {(t) => (
            <Heading niveau={2} apparenceComme={4}>
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            <Link href="/agir/communes" className="underline">
              Communes
            </Link>{' '}
            (territoriales ou libres) ;
          </li>
          <li>
            <Link href="/agir/federations" className="underline">
              Fédérations
            </Link>{' '}
            (géographique, thématique, mixte) ;
          </li>
          <li>
            <Link href="/agir/confederations" className="underline">
              Confédérations
            </Link>{' '}
            ;
          </li>
          <li>
            <Link href="/agir/assemblee" className="underline">
              Assemblée Confédérale
            </Link>{' '}
            (binômes tirés au sort).
          </li>
        </ul>
      </section>
    </Container>
  );
}
