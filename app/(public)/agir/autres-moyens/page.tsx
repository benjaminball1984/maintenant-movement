import { MarkdownLeger } from '@/components/contenu/MarkdownLeger';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { listerOrganisationsParCategorie } from '@/lib/autres-moyens/requetes';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';

const FALLBACKS = {
  intro:
    "Il y a d'autres moyens d'agir, en voici quelques-uns. Cette liste est tenue par la modération de Maintenant! ; elle ne constitue pas un endossement, juste un repère. Une organisation peut être retirée si elle s'écarte de ses valeurs affichées.",
  emptyTitre: 'Liste en construction',
  emptyCorps:
    "Aucune organisation listée pour l'instant. La modération l'enrichira au fur et à mesure.",
  distance:
    "**Distance protectrice :** Maintenant! ne répond pas des prises de position ni des actions de ces organisations. La liste existe par présomption d'utilité ; un retrait peut être demandé à tout moment via la page de contact.",
};

export const metadata: Metadata = {
  title: "D'autres moyens d'agir",
  description:
    "Il y a d'autres moyens d'agir, en voici quelques-uns. Liste de redirections sans endossement (cf. doctrine §7D).",
};

/**
 * Page « D'autres moyens d'agir ».
 *
 * Cf. spec §7D :
 *   « Page courte, pas d'éditorialisation. "Il y a d'autres moyens
 *     d'agir, les voici." Liste de redirections sans endossement.
 *     Présomption d'utilité. Retrait si problématique. »
 *
 * On ne met aucune accroche éditoriale qui pourrait être prise comme
 * un endossement. Le ton est neutre, sobre.
 */
export default async function PageAutresMoyens() {
  const [groupes, estAdmin, intro, emptyTitre, emptyCorps, distance] = await Promise.all([
    listerOrganisationsParCategorie(),
    estAdminCourant(),
    lireContenuEditorial('agir.autres_moyens.intro', { valeurMd: FALLBACKS.intro }),
    lireContenuEditorial('agir.autres_moyens.empty_titre', { valeurMd: FALLBACKS.emptyTitre }),
    lireContenuEditorial('agir.autres_moyens.empty_corps', { valeurMd: FALLBACKS.emptyCorps }),
    lireContenuEditorial('agir.autres_moyens.distance', { valeurMd: FALLBACKS.distance }),
  ]);
  const entries = Array.from(groupes.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">Agir</p>
        <Heading niveau={1}>D'autres moyens d'agir</Heading>
        <TexteEditableAdmin
          cle="agir.autres_moyens.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro page autres moyens"
          multilignes
          longueurMax={600}
        >
          {(t) => <p className="mt-3 max-w-2xl text-text-2">{t}</p>}
        </TexteEditableAdmin>
      </header>

      {entries.length === 0 ? (
        <Alert
          variant="info"
          titre={
            <TexteEditableAdmin
              cle="agir.autres_moyens.empty_titre"
              valeurInitiale={emptyTitre.valeurMd}
              estAdmin={estAdmin}
              libelle="titre empty state autres moyens"
              longueurMax={60}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          }
        >
          <TexteEditableAdmin
            cle="agir.autres_moyens.empty_corps"
            valeurInitiale={emptyCorps.valeurMd}
            estAdmin={estAdmin}
            libelle="corps empty state autres moyens"
            longueurMax={300}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </Alert>
      ) : (
        <ul className="grid gap-8">
          {entries.map(([categorie, orgas]) => (
            <li key={categorie}>
              <Heading niveau={2} apparenceComme={3} className="mb-3">
                {categorie === 'autres' ? 'Autres' : libelleCategorie(categorie)}
              </Heading>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {orgas.map((o) => (
                  <li key={o.id}>
                    <Card variant="ombre" className="flex h-full flex-col gap-2">
                      <a
                        href={o.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-text-1 underline-offset-4 hover:underline"
                      >
                        {o.nom}
                        <ExternalLink size={14} strokeWidth={1.5} className="text-text-3" />
                      </a>
                      {o.description_courte !== null && o.description_courte.trim() !== '' ? (
                        <p className="text-sm text-text-2">{o.description_courte}</p>
                      ) : null}
                    </Card>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-12 grid gap-2 rounded-md border border-border bg-surface-2 p-6 text-sm text-text-3">
        <TexteEditableAdmin
          cle="agir.autres_moyens.distance"
          valeurInitiale={distance.valeurMd}
          estAdmin={estAdmin}
          libelle="encart distance protectrice (Markdown leger)"
          multilignes
          longueurMax={500}
        >
          {(t) => <MarkdownLeger texte={t} />}
        </TexteEditableAdmin>
      </section>
    </Container>
  );
}

function libelleCategorie(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
