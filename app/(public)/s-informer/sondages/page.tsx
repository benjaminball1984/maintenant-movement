import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { listerSondagesOuverts } from '@/lib/sondages/requetes';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sondages',
  description: 'Sondages Maintenant! — vote connecté obligatoire, 2 modes (classique + pondéré).',
};

const FALLBACKS = {
  intro:
    'Vote connecté obligatoire. 2 modes : classique (vote brut) ou pondéré (méthode des quotas dès 300 répondant·es).',
  ctaConnecte: 'Créer un sondage',
  ctaDeconnecte: 'Connecte-toi pour créer',
  emptyTitre: 'Aucun sondage publié pour le moment',
  emptyCorps: 'Crée le premier sondage pour ouvrir la liste.',
};

export default async function PageSondages() {
  const [sondages, session, estAdmin, intro, ctaConnecte, ctaDeconnecte, emptyTitre, emptyCorps] =
    await Promise.all([
      listerSondagesOuverts(),
      getSession(),
      estAdminCourant(),
      lireContenuEditorial('s-informer.sondages.intro', { valeurMd: FALLBACKS.intro }),
      lireContenuEditorial('s-informer.sondages.cta_connecte', {
        valeurMd: FALLBACKS.ctaConnecte,
      }),
      lireContenuEditorial('s-informer.sondages.cta_deconnecte', {
        valeurMd: FALLBACKS.ctaDeconnecte,
      }),
      lireContenuEditorial('s-informer.sondages.empty_titre', { valeurMd: FALLBACKS.emptyTitre }),
      lireContenuEditorial('s-informer.sondages.empty_corps', { valeurMd: FALLBACKS.emptyCorps }),
    ]);
  const personneConnectee = session !== null;

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">S'informer</p>
          <Heading niveau={1}>Sondages</Heading>
          <TexteEditableAdmin
            cle="s-informer.sondages.intro"
            valeurInitiale={intro.valeurMd}
            estAdmin={estAdmin}
            libelle="intro page sondages"
            multilignes
            longueurMax={400}
          >
            {(t) => <p className="mt-3 max-w-2xl text-text-2">{t}</p>}
          </TexteEditableAdmin>
        </div>
        <TexteEditableAdmin
          cle={
            personneConnectee
              ? 's-informer.sondages.cta_connecte'
              : 's-informer.sondages.cta_deconnecte'
          }
          valeurInitiale={personneConnectee ? ctaConnecte.valeurMd : ctaDeconnecte.valeurMd}
          estAdmin={estAdmin}
          libelle={`CTA sondages (${personneConnectee ? 'connecte' : 'deconnecte'})`}
          longueurMax={60}
        >
          {(t) => (
            <Link
              href="/s-informer/sondages/nouveau"
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

      {sondages.length === 0 ? (
        <Alert
          variant="info"
          titre={
            <TexteEditableAdmin
              cle="s-informer.sondages.empty_titre"
              valeurInitiale={emptyTitre.valeurMd}
              estAdmin={estAdmin}
              libelle="titre empty state sondages"
              longueurMax={60}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          }
        >
          <TexteEditableAdmin
            cle="s-informer.sondages.empty_corps"
            valeurInitiale={emptyCorps.valeurMd}
            estAdmin={estAdmin}
            libelle="corps empty state sondages"
            longueurMax={200}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </Alert>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sondages.map((s) => (
            <li key={s.id}>
              <Card variant="ombre" className="flex h-full flex-col gap-2">
                <header className="flex items-center justify-between gap-2">
                  <Badge variant={s.mode === 'pondere' ? 'accent' : 'brand'}>
                    {s.mode === 'pondere' ? 'Pondéré' : 'Classique'}
                  </Badge>
                  {s.statut === 'ferme' ? <Badge variant="default">Fermé</Badge> : null}
                </header>
                <h2 className="text-lg font-bold leading-tight text-text-1">
                  <Link
                    href={`/s-informer/sondages/${s.slug}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {s.titre}
                  </Link>
                </h2>
                <p className="line-clamp-3 text-sm text-text-2">{s.question}</p>
                <p className="mt-auto text-xs text-text-3">{s.options.length} options</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
