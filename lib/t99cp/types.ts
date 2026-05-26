/**
 * Contrat du service 99-coin (T99CP, The 99 Coin Project).
 *
 * Réseau : Polygon. Contrat ERC-20 :
 * `0x7275cfc83f486d53ca1379fc1f8025490bdcc79a`.
 *
 * Usages :
 * - adhésion 12 99-coin (chantier 5.1)
 * - dons cagnottes en T99CP (chantier 3.3, frais 0 %)
 * - SEL : 1 99-coin = 1 € = 1 minute, crédit après modération 2 h (chantier 4.2)
 * - RBU 30 99-coin / mois via wallet certifié (chantier 4.2)
 *
 * Switch via `T99CP_NETWORK` : `mock` (défaut) | `mumbai` | `polygon_mainnet`.
 *
 * ⚠️ Cycle V2 chantier V2.1.1 : la plateforme ne signe AUCUNE transaction
 * (§19 des principes-transversaux-V2.md). La méthode `envoyerTransaction`
 * est conservée pour la compatibilité avec les flux V1 (adhésion T99CP,
 * crédit SEL, marché solidaire) mais est **DEPRECATED** : tout nouveau
 * code doit utiliser la redirection vers `https://the99coinproject.org/`
 * + vérification de hash via `verifierTransaction` + enregistrement du
 * hash consommé via `lib/t99cp/hashes-consommes.ts`.
 */
export interface ResultatBalance {
  /** Balance en plus petite unité du token (wei-équivalent). */
  balanceUnites: bigint;
  /** Balance en représentation humaine (99-coin entiers). */
  balanceLisible: number;
}

export interface ResultatTransaction {
  txHash: string;
  /** Indique si la transaction est réelle (Polygon) ou mockée. */
  estReelle: boolean;
}

export interface StatutTransaction {
  confirmed: boolean;
  numeroBloc: number | null;
}

export interface T99CPService {
  /**
   * Récupère la balance 99-coin d'un wallet en LECTURE SEULE sur Polygon.
   * Méthode conforme au §19 V2 (aucun wallet intégré côté plateforme).
   */
  obtenirBalance(adresseWallet: string): Promise<ResultatBalance>;

  /**
   * @deprecated Cycle V2 V2.1.1 — la plateforme ne signe AUCUNE transaction
   * (§19). Utiliser à la place : redirection vers la home
   * `https://the99coinproject.org/` (jamais d'URL profonde), puis
   * `verifierTransaction(txHash)` au retour, puis `enregistrerHashConsomme`
   * de `lib/t99cp/hashes-consommes.ts` pour garantir l'unicité.
   *
   * Cette méthode reste implémentée pour ne pas casser les flux V1 en
   * attendant leur refacto V2 (adhésion T99CP, crédit SEL, marché). Les
   * callers connus sont listés dans le MANIFEST V2.1.1. Ne PAS l'utiliser
   * dans du code neuf.
   */
  envoyerTransaction(
    adresseSource: string,
    adresseDestination: string,
    montantUnites: bigint,
  ): Promise<ResultatTransaction>;

  /**
   * Vérifie qu'une transaction est confirmée on-chain. Source de vérité
   * du paiement T99CP côté plateforme (en complément du garde-fou
   * d'unicité `t99cp_hash_consomme`, V2.1.1).
   */
  verifierTransaction(txHash: string): Promise<StatutTransaction>;
}
