/**
 * Libellés affichables des types de cagnotte (centralisé V2.6 polish Q2).
 *
 * Cette table (type technique de `cagnotte.type` vers libellé humain) était
 * recopiée à l'identique dans trois endroits : la carte de cagnotte
 * (`components/cagnottes/CarteCagnotte.tsx`), la page de détail
 * (`app/(public)/mobiliser/cagnottes/[slug]/page.tsx`) et la console de
 * modération (`app/admin/moderation/cagnottes/page.tsx`). Source unique
 * désormais, pour éviter toute divergence future.
 *
 * Vocabulaire (cf. `docs/specs/03_VOCABULAIRE.md`) : ces termes ne sont pas
 * modifiables sans arbitrage de Lilou/Ben.
 */
export const LIBELLE_TYPE_CAGNOTTE: Record<string, string> = {
  ouverte: 'Cagnotte ouverte',
  lutte: 'Caisse de lutte',
  cotisation: 'Cotisation',
};
