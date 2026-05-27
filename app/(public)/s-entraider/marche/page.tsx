import { MarkdownLeger } from '@/components/contenu/MarkdownLeger';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { LISTE_ONGLETS } from '@/lib/marche/config';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Marché solidaire',
  description:
    'Vente ou don gratuit, boutiques éphémères, minimarchés solidaires. 4 monnaies acceptées en physique, T99CP et Euros en ligne.',
};

const FALLBACKS = {
  intro:
    'Vente ou don gratuit entre particulier·ères, boutiques éphémères, minimarchés physiques. Frais 5 % en euros, 0 % en 99-coin (T99CP). Notation 5 étoiles unilatérale.',
  cardLabel: 'Onglet',
  conditionsTitre: "Conditions d'usage du Marché solidaire",
  conditions:
    "- Modération **a posteriori** : publication immédiate, retrait par modé/admin si problème.\n- Fraîcheur : 3 mois sans interaction → modale de gestion via la messagerie.\n- Retrait : rencontre physique OU envoi postal (port à la charge de la personne acheteuse).\n- En ligne : seules T99CP et Euros sont acceptées. Ğ1 et monnaies locales complémentaires restent réservées aux minimarchés physiques.\n- Notation 5 étoiles unilatérale : seule l'acheteureuse note la vendeureuse.",
};

/**
 * Page d'accueil du Marché solidaire — vitrine des 3 onglets.
 *
 * Cf. spec §6F. Chaque onglet ouvre une page dédiée (produits,
 * boutiques, minimarchés). Pas de liste mêlée pour rester lisible.
 */
export default async function PageMarche() {
  const [estAdmin, intro, cardLabel, conditionsTitre, conditions] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('s-entraider.marche.intro', { valeurMd: FALLBACKS.intro }),
    lireContenuEditorial('s-entraider.marche.card_label', { valeurMd: FALLBACKS.cardLabel }),
    lireContenuEditorial('s-entraider.marche.conditions_titre', {
      valeurMd: FALLBACKS.conditionsTitre,
    }),
    lireContenuEditorial('s-entraider.marche.conditions', { valeurMd: FALLBACKS.conditions }),
  ]);

  return (
    <>
      <header className="mb-8">
        <Heading niveau={1}>Marché solidaire</Heading>
        <TexteEditableAdmin
          cle="s-entraider.marche.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro page marche"
          multilignes
          longueurMax={400}
        >
          {(t) => <p className="mt-3 max-w-2xl text-text-2">{t}</p>}
        </TexteEditableAdmin>
      </header>

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {LISTE_ONGLETS.map((onglet) => (
          <li key={onglet.slug}>
            <Link
              href={onglet.href}
              className="block h-full transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Card variant="ombre" className="flex h-full flex-col gap-2">
                <TexteEditableAdmin
                  cle="s-entraider.marche.card_label"
                  valeurInitiale={cardLabel.valeurMd}
                  estAdmin={estAdmin}
                  libelle="label generique des cards onglet"
                  longueurMax={20}
                >
                  {(t) => (
                    <p className="text-xs font-bold uppercase tracking-cap text-brand">{t}</p>
                  )}
                </TexteEditableAdmin>
                <Heading niveau={2} apparenceComme={3}>
                  {onglet.libelle}
                </Heading>
                <p className="text-sm text-text-2">{onglet.description}</p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-12 grid gap-3 rounded-md border border-border bg-surface-2 p-6 text-sm text-text-2">
        <TexteEditableAdmin
          cle="s-entraider.marche.conditions_titre"
          valeurInitiale={conditionsTitre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre section conditions usage"
          longueurMax={80}
        >
          {(t) => (
            <Heading niveau={2} apparenceComme={4}>
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="s-entraider.marche.conditions"
          valeurInitiale={conditions.valeurMd}
          estAdmin={estAdmin}
          libelle="liste des conditions d'usage (Markdown leger : listes et **gras**)"
          multilignes
          longueurMax={1500}
        >
          {(t) => <MarkdownLeger texte={t} />}
        </TexteEditableAdmin>
      </section>
    </>
  );
}
