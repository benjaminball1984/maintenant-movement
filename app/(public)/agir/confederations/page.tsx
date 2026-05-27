import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { listerConfederations } from '@/lib/communes/requetes';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Confédérations' };

const FALLBACKS = {
  introAmorce: "Agrègent des fédérations, récursif au-delà. Source de l'",
  introFin: '(binômes tirés au sort par entité).',
  empty: "Aucune confédération pour l'instant.",
};

export default async function PageConfederations() {
  const [confederations, estAdmin, introAmorce, introFin, empty] = await Promise.all([
    listerConfederations(),
    estAdminCourant(),
    lireContenuEditorial('agir.confederations.intro_amorce', {
      valeurMd: FALLBACKS.introAmorce,
    }),
    lireContenuEditorial('agir.confederations.intro_fin', { valeurMd: FALLBACKS.introFin }),
    lireContenuEditorial('agir.confederations.empty', { valeurMd: FALLBACKS.empty }),
  ]);
  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">Agir</p>
        <Heading niveau={1}>Confédérations</Heading>
        <p className="mt-3 max-w-2xl text-text-2">
          <TexteEditableAdmin
            cle="agir.confederations.intro_amorce"
            valeurInitiale={introAmorce.valeurMd}
            estAdmin={estAdmin}
            libelle="amorce intro confederations (avant le lien Assemblee Confederale)"
            multilignes
            longueurMax={300}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
          <Link href="/agir/assemblee" className="underline">
            Assemblée Confédérale
          </Link>{' '}
          <TexteEditableAdmin
            cle="agir.confederations.intro_fin"
            valeurInitiale={introFin.valeurMd}
            estAdmin={estAdmin}
            libelle="fin intro confederations (apres le lien)"
            longueurMax={200}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </p>
      </header>

      {confederations.length === 0 ? (
        <TexteEditableAdmin
          cle="agir.confederations.empty"
          valeurInitiale={empty.valeurMd}
          estAdmin={estAdmin}
          libelle="empty state confederations"
          longueurMax={200}
        >
          {(t) => <p className="text-sm text-text-3">{t}</p>}
        </TexteEditableAdmin>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {confederations.map((c) => (
            <li key={c.id}>
              <Card variant="ombre" className="flex flex-col gap-2">
                <h3 className="text-lg font-bold leading-tight text-text-1">{c.nom}</h3>
                {c.description_courte !== null && c.description_courte.trim() !== '' ? (
                  <p className="text-sm text-text-2">{c.description_courte}</p>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
