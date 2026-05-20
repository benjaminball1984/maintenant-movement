import { randomBytes } from 'node:crypto';
import type {
  ResultatBalance,
  ResultatTransaction,
  StatutTransaction,
  T99CPService,
} from './types';

/**
 * Mock du service T99CP.
 *
 * - Balance fictive de 100 99-coin par wallet.
 * - Transactions toujours acceptées, hash aléatoire.
 * - Vérification toujours confirmée au bloc 1.
 *
 * Permet aux flux d'adhésion T99CP, dons cagnottes, RBU et SEL de tourner
 * sans connexion réelle à Polygon.
 */
export class MockT99CPService implements T99CPService {
  /** Balance par défaut renvoyée par le mock : 100 99-coin. */
  private static readonly BALANCE_PAR_DEFAUT = 100n;

  async obtenirBalance(adresseWallet: string): Promise<ResultatBalance> {
    // biome-ignore lint/suspicious/noConsoleLog: trace explicite du mock en dev.
    console.log(`[MockT99CP] balance demandée pour ${adresseWallet}`);
    return {
      balanceUnites: MockT99CPService.BALANCE_PAR_DEFAUT,
      balanceLisible: Number(MockT99CPService.BALANCE_PAR_DEFAUT),
    };
  }

  async envoyerTransaction(
    adresseSource: string,
    adresseDestination: string,
    montantUnites: bigint,
  ): Promise<ResultatTransaction> {
    const txHash = `0xmock${randomBytes(30).toString('hex')}`;
    // biome-ignore lint/suspicious/noConsoleLog: trace explicite du mock en dev.
    console.log(
      `[MockT99CP] tx ${txHash} : ${adresseSource} -> ${adresseDestination} : ${montantUnites}`,
    );
    return { txHash, estReelle: false };
  }

  async verifierTransaction(txHash: string): Promise<StatutTransaction> {
    // biome-ignore lint/suspicious/noConsoleLog: trace explicite du mock en dev.
    console.log(`[MockT99CP] vérification ${txHash}`);
    return { confirmed: true, numeroBloc: 1 };
  }
}
