import type {
  ResultatBalance,
  ResultatTransaction,
  StatutTransaction,
  T99CPService,
} from './types';

/**
 * Implémentation Polygon du service T99CP.
 *
 * Volontairement non implémentée au chantier 0.1. La pose réelle se fait
 * au chantier 5.1 (adhésion T99CP) et au chantier dédié API T99CP
 * (wallets certifiés + RBU 30 99-coin/mois).
 *
 * Sécurité (cf. CLAUDE.md §6) : la clé privée du wallet de trésorerie est
 * chiffrée au repos, idéalement signatures multi-sig (à confirmer avec
 * l'équipe T99CP).
 */
export class PolygonT99CPService implements T99CPService {
  obtenirBalance(_adresseWallet: string): Promise<ResultatBalance> {
    throw new Error('PolygonT99CPService.obtenirBalance : à implémenter au chantier 5.1.');
  }

  envoyerTransaction(
    _adresseSource: string,
    _adresseDestination: string,
    _montantUnites: bigint,
  ): Promise<ResultatTransaction> {
    throw new Error('PolygonT99CPService.envoyerTransaction : à implémenter au chantier 5.1.');
  }

  verifierTransaction(_txHash: string): Promise<StatutTransaction> {
    throw new Error('PolygonT99CPService.verifierTransaction : à implémenter au chantier 5.1.');
  }
}
