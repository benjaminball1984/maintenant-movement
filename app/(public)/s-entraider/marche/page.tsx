import { Card, Heading } from '@/components/ui';
import { LISTE_ONGLETS } from '@/lib/marche/config';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Marché solidaire',
  description:
    'Vente ou don gratuit, boutiques éphémères, minimarchés solidaires. 4 monnaies acceptées en physique, T99CP et Euros en ligne.',
};

/**
 * Page d'accueil du Marché solidaire — vitrine des 3 onglets.
 *
 * Cf. spec §6F. Chaque onglet ouvre une page dédiée (produits,
 * boutiques, minimarchés). Pas de liste mêlée pour rester lisible.
 */
export default function PageMarche() {
  return (
    <>
      <header className="mb-8">
        <Heading niveau={1}>Marché solidaire</Heading>
        <p className="mt-3 max-w-2xl text-text-2">
          Vente ou don gratuit entre particulier·ères, boutiques éphémères, minimarchés physiques.
          Frais 5 % en euros, 0 % en 99-coin (T99CP). Notation 5 étoiles unilatérale.
        </p>
      </header>

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {LISTE_ONGLETS.map((onglet) => (
          <li key={onglet.slug}>
            <Link
              href={onglet.href}
              className="block h-full transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Card variant="ombre" className="flex h-full flex-col gap-2">
                <p className="text-xs font-bold uppercase tracking-cap text-brand">Onglet</p>
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
        <Heading niveau={2} apparenceComme={4}>
          Conditions d'usage du Marché solidaire
        </Heading>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            Modération a posteriori : publication immédiate, retrait par modé/admin si problème.
          </li>
          <li>Fraîcheur : 3 mois sans interaction → modale de gestion via la messagerie.</li>
          <li>
            Retrait : rencontre physique OU envoi postal (port à la charge de la personne
            acheteuse).
          </li>
          <li>
            En ligne : seules T99CP et Euros sont acceptées. Ğ1 et monnaies locales complémentaires
            restent réservées aux minimarchés physiques.
          </li>
          <li>Notation 5 étoiles unilatérale : seule l'acheteureuse note la vendeureuse.</li>
        </ul>
      </section>
    </>
  );
}
