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
  /** Récupère la balance 99-coin d'un wallet. */
  obtenirBalance(adresseWallet: string): Promise<ResultatBalance>;
  /**
   * Émet une transaction (utilisé pour RBU et adhésions T99CP).
   * Le wallet source dépend du contexte (trésorerie mouvement ou wallet personne).
   */
  envoyerTransaction(
    adresseSource: string,
    adresseDestination: string,
    montantUnites: bigint,
  ): Promise<ResultatTransaction>;
  /** Vérifie qu'une transaction est confirmée on-chain. */
  verifierTransaction(txHash: string): Promise<StatutTransaction>;
}
