/**
 * Contrat du service LiveKit (infrastructure visio des salles Décider).
 *
 * Cadre (cf. 01_ARCHITECTURE.md §4F) :
 * - Salles permanentes par commune + salles temporaires nommées.
 * - Pas Zoom, pas Meet, pas Teams : LiveKit self-hosted.
 * - Tokens d'accès **émis par le serveur Maintenant!**, jamais par le client.
 * - Permission par salle, par rôle (participant, modérateurice).
 *
 * Switch via `LIVEKIT_PROVIDER` : `mock` (défaut) | `livekit`.
 */
export type RoleSalle = 'participant' | 'moderateurice';

export interface SalleCreee {
  roomId: string;
  /** URL WebSocket de la salle (vide en mock). */
  url: string;
  estReelle: boolean;
}

export interface JetonAcces {
  /** JWT signé par le serveur LiveKit. En mock, chaîne factice. */
  token: string;
  /** Date d'expiration en epoch millisecondes. */
  expireA: number;
}

export interface LiveKitService {
  /** Crée (ou récupère) une salle de visio. */
  creerSalle(nom: string): Promise<SalleCreee>;
  /** Génère un jeton d'accès pour une personne et un rôle donnés. */
  genererJeton(roomId: string, identite: string, role: RoleSalle): Promise<JetonAcces>;
}
