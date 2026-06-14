/**
 * Adapter Twitch (rubrique « Lives » de Maintenant Médias, demande Ben
 * 2026-06-14). Pattern adapter du projet (comme email/payments/storage) :
 * une interface + un Mock (sans clé, rubrique vide) + l'implémentation réelle
 * (API Twitch Helix). La factory `getTwitchService()` choisit selon la
 * présence de `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET`.
 *
 * Twitch n'a pas de flux RSS : on interroge l'API pour savoir qui est EN
 * DIRECT parmi nos chaînes engagées, et on n'affiche que les directs en cours.
 */

/** Un direct Twitch en cours. */
export interface LiveTwitch {
  /** Identifiant de la chaîne (login, après twitch.tv/). */
  handle: string;
  /** Nom affiché de la chaîne. */
  nom: string;
  /** Titre du direct. */
  titre: string;
  /** Jeu / catégorie du direct (peut être vide). */
  jeu: string;
  /** Nombre de spectateur·ices. */
  viewers: number;
  /** Miniature du direct (dimensions déjà substituées). */
  vignetteUrl: string | null;
  /** Langue déclarée du direct (code ISO, ex. `fr`). */
  langue: string;
}

export interface TwitchService {
  /**
   * Renvoie les chaînes actuellement EN DIRECT parmi la liste de `handles`
   * fournie. Best-effort : en cas d'erreur réseau/API, renvoie [].
   */
  chainesEnDirect(handles: string[]): Promise<LiveTwitch[]>;
}
