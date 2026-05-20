import type { JetonAcces, LiveKitService, RoleSalle, SalleCreee } from './types';

/**
 * Implémentation réelle LiveKit (self-hosted).
 *
 * Volontairement non implémentée au chantier 0.1. La pose réelle se fait
 * au chantier 7.6 (infrastructure Décider complète : salles, votes,
 * tokens, enregistrement selon type d'instance, privacy par périmètre).
 */
export class LiveKitRealService implements LiveKitService {
  creerSalle(_nom: string): Promise<SalleCreee> {
    throw new Error('LiveKitRealService.creerSalle : à implémenter au chantier 7.6.');
  }

  genererJeton(_roomId: string, _identite: string, _role: RoleSalle): Promise<JetonAcces> {
    throw new Error('LiveKitRealService.genererJeton : à implémenter au chantier 7.6.');
  }
}
