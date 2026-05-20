import { Heading } from '@/components/ui';

/**
 * Bloc titre de la page d'accueil.
 *
 * Textes fixés par la spec (`01_ARCHITECTURE.md §3`) : surtitre, titre,
 * sous-titre. Aucune marge de manœuvre éditoriale ici, c'est le marqueur
 * identitaire du mouvement.
 */
export function BlocTitre() {
  return (
    <section
      aria-label="Identité du mouvement"
      className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8"
    >
      <p className="font-body text-sm font-bold uppercase tracking-cap text-text-3">
        La plateforme citoyenne des 99 %
      </p>
      <Heading niveau={1} className="bg-grad bg-clip-text text-transparent">
        Maintenant!
      </Heading>
      <p className="max-w-2xl text-lg text-text-2 sm:text-xl">
        Pour une vie digne et heureuse pour tous et toutes, dans un monde vivable. Face aux
        oppressions systémiques, nos luttes doivent devenir systémiques.
      </p>
    </section>
  );
}
