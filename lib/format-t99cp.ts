/**
 * Helper de formatage des montants en T99CP (V2.4.44).
 *
 * Extrait de `lib/marche/config.ts` (V1 chantier 4.3) pour partage
 * inter-modules et test isolé. 1 T99CP = 10^18 unités sur Polygon.
 *
 * Convention : tronque les décimales au-delà de 4 pour la lecture
 * humaine. La valeur exacte reste dans le string brut.
 *
 * Suffixe par défaut : « 99-coin » (forme française avec tiret, cf.
 * vocabulaire fixé `docs/specs/03_VOCABULAIRE.md`).
 */

const PUISSANCE_T99CP = 10n ** 18n;

/**
 * Formate un montant en T99CP à partir d'une string d'unités brutes.
 *
 * @param unites - le montant en unités base (string pour ne pas
 *   perdre de précision sur les grands nombres).
 * @param suffixe - suffixe à ajouter (« 99-coin » par défaut, « 99c »
 *   pour les zones compactes).
 *
 * @returns chaîne formatée, ou chaîne vide si null/undefined/0/invalide.
 *
 * @example formaterT99CP('1000000000000000000') → '1 99-coin'
 * @example formaterT99CP('1500000000000000000') → '1,5 99-coin'
 * @example formaterT99CP('123456789012345678901') → '123,4567 99-coin'
 */
export function formaterT99CP(unites: string | null | undefined, suffixe = '99-coin'): string {
  if (unites === null || unites === undefined || unites === '' || unites === '0') return '';
  try {
    const valeur = BigInt(unites);
    if (valeur === 0n) return '';
    const entier = valeur / PUISSANCE_T99CP;
    const reste = valeur % PUISSANCE_T99CP;
    if (reste === 0n) return `${entier.toString()} ${suffixe}`;
    const decimales = reste.toString().padStart(18, '0').slice(0, 4).replace(/0+$/, '');
    const sep = decimales === '' ? '' : `,${decimales}`;
    return `${entier.toString()}${sep} ${suffixe}`;
  } catch {
    return '';
  }
}
