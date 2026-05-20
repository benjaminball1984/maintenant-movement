import { randomUUID } from 'node:crypto';
import type { JetonAcces, LiveKitService, RoleSalle, SalleCreee } from './types';

/**
 * Mock du service LiveKit.
 *
 * Permet de coder et tester toute l'UI Décider (sélection mode, fenêtre
 * de vote, jugement majoritaire, PV) sans serveur WebRTC.
 *
 * Le composant `<SalleDecider>` (chantier 7.6) affichera un placeholder
 * « visio mockée » à la place du flux vidéo quand le provider est `mock`.
 */
export class MockLiveKitService implements LiveKitService {
  async creerSalle(nom: string): Promise<SalleCreee> {
    const roomId = `mock-room-${nom}-${randomUUID().slice(0, 8)}`;
    // biome-ignore lint/suspicious/noConsoleLog: trace explicite du mock en dev.
    console.log(`[MockLiveKit] salle créée : ${roomId}`);
    return { roomId, url: '', estReelle: false };
  }

  async genererJeton(roomId: string, identite: string, role: RoleSalle): Promise<JetonAcces> {
    const token = `mock-token-${roomId}-${identite}-${role}`;
    // 4 heures d'expiration : cohérent avec une séance Décider longue.
    const expireA = Date.now() + 4 * 60 * 60 * 1000;
    return { token, expireA };
  }
}
