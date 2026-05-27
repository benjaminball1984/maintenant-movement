import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Badge, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { listerFederations } from '@/lib/communes/requetes';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Fédérations' };

const FALLBACKS = {
  intro:
    'Agrègent des communes par affinité (géographique, thématique, mixte). Pas de continuité territoriale obligatoire, pas de limite de nombre.',
  ctaConnecte: 'Créer une fédération',
  ctaDeconnecte: 'Connecte-toi pour créer',
  empty: "Aucune fédération pour l'instant.",
};

const LIBELLE_TYPE: Record<string, string> = {
  geographique: 'Géographique',
  thematique: 'Thématique',
  mixte: 'Mixte',
};

export default async function PageFederations() {
  const [federations, session, estAdmin, intro, ctaConnecte, ctaDeconnecte, empty] =
    await Promise.all([
      listerFederations(),
      getSession(),
      estAdminCourant(),
      lireContenuEditorial('agir.federations.intro', { valeurMd: FALLBACKS.intro }),
      lireContenuEditorial('agir.federations.cta_connecte', {
        valeurMd: FALLBACKS.ctaConnecte,
      }),
      lireContenuEditorial('agir.federations.cta_deconnecte', {
        valeurMd: FALLBACKS.ctaDeconnecte,
      }),
      lireContenuEditorial('agir.federations.empty', { valeurMd: FALLBACKS.empty }),
    ]);
  const personneConnectee = session !== null;
  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">Agir</p>
          <Heading niveau={1}>Fédérations</Heading>
          <TexteEditableAdmin
            cle="agir.federations.intro"
            valeurInitiale={intro.valeurMd}
            estAdmin={estAdmin}
            libelle="intro page federations"
            multilignes
            longueurMax={400}
          >
            {(t) => <p className="mt-3 max-w-2xl text-text-2">{t}</p>}
          </TexteEditableAdmin>
        </div>
        <TexteEditableAdmin
          cle={
            personneConnectee ? 'agir.federations.cta_connecte' : 'agir.federations.cta_deconnecte'
          }
          valeurInitiale={personneConnectee ? ctaConnecte.valeurMd : ctaDeconnecte.valeurMd}
          estAdmin={estAdmin}
          libelle={`CTA federations (${personneConnectee ? 'connecte' : 'deconnecte'})`}
          longueurMax={60}
        >
          {(t) => (
            <Link
              href="/agir/federations/nouvelle"
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

      {federations.length === 0 ? (
        <TexteEditableAdmin
          cle="agir.federations.empty"
          valeurInitiale={empty.valeurMd}
          estAdmin={estAdmin}
          libelle="empty state federations"
          longueurMax={200}
        >
          {(t) => <p className="text-sm text-text-3">{t}</p>}
        </TexteEditableAdmin>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {federations.map((f) => (
            <li key={f.id}>
              <Card variant="ombre" className="flex flex-col gap-2">
                <Badge variant="brand">{LIBELLE_TYPE[f.type] ?? f.type}</Badge>
                <h3 className="text-lg font-bold leading-tight text-text-1">
                  <Link
                    href={`/agir/federations/${f.slug}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {f.nom}
                  </Link>
                </h3>
                {f.description_courte !== null && f.description_courte.trim() !== '' ? (
                  <p className="text-sm text-text-2">{f.description_courte}</p>
                ) : null}
                <p className="text-xs text-text-3">
                  {f.nombre_communes} commune{f.nombre_communes > 1 ? 's' : ''} rattachée
                  {f.nombre_communes > 1 ? 's' : ''}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
