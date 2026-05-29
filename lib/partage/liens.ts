/**
 * Fabrique des URLs de partage pour les applications de messagerie et
 * réseaux courants (V2.5.7 — Master Plan V2.6 Phase F).
 *
 * Helpers PURS, testables sans navigateur. Les URLs renvoyées suivent
 * les conventions documentées par chaque service au moment de l'écriture.
 * Si un service change ses paramètres, on adapte ici sans toucher au
 * reste du code.
 *
 * Pour chacun, on construit une URL `https://...` qui, ouverte dans un
 * navigateur (desktop ou mobile), bascule vers l'app native quand elle
 * est installée, ou vers la web view sinon.
 */

export interface ParamsPartage {
  /** Titre court (ex. titre de la pétition). */
  titre: string;
  /** URL absolue à partager. */
  url: string;
  /** Message préformulé. Doit inclure une variante du titre + appel à action. */
  message: string;
}

/** Encode un texte pour URL. Wrapper de `encodeURIComponent` pour cohérence. */
function enc(s: string): string {
  return encodeURIComponent(s);
}

/** Lien WhatsApp universel (mobile + desktop). */
export function lienWhatsApp({ message, url }: ParamsPartage): string {
  return `https://wa.me/?text=${enc(`${message} ${url}`)}`;
}

/** Lien Telegram universel. */
export function lienTelegram({ message, url }: ParamsPartage): string {
  return `https://t.me/share/url?url=${enc(url)}&text=${enc(message)}`;
}

/**
 * Lien Messenger. Sur mobile, l'URL `fb-messenger://share` ouvre l'app.
 * Sur desktop, on retombe sur le partage Facebook standard. On choisit
 * la voie web universelle (le navigateur sait basculer si possible).
 */
export function lienMessenger({ url }: ParamsPartage): string {
  return `https://www.facebook.com/dialog/send?app_id=&link=${enc(url)}&redirect_uri=${enc(url)}`;
}

/** Lien Signal (scheme `sgnl://`). Fonctionne si l'app est installée. */
export function lienSignal({ message, url }: ParamsPartage): string {
  return `sgnl://send?text=${enc(`${message} ${url}`)}`;
}

/** Lien email (mailto). Sujet = titre, corps = message + URL. */
export function lienEmail({ titre, message, url }: ParamsPartage): string {
  const corps = `${message}\n\n${url}`;
  return `mailto:?subject=${enc(titre)}&body=${enc(corps)}`;
}

/**
 * Lien Mastodon. Pas de protocole standardisé : la convention
 * communautaire est d'utiliser l'URL d'instance par défaut de la
 * personne (pas universelle). On utilise `https://mastodon.social/share`
 * qui marche pour la plupart des comptes ; les puristes pourront éditer
 * le libellé via le CMS ou copier-coller le message.
 */
export function lienMastodon({ message, url }: ParamsPartage): string {
  return `https://mastodon.social/share?text=${enc(`${message} ${url}`)}`;
}

/**
 * Liste compacte de tous les fabricants disponibles. Utilisé par le
 * composant `<BoutonsPartage>` pour itérer proprement.
 */
export const FABRICANTS_PARTAGE = [
  { id: 'whatsapp', libelle: 'WhatsApp', fabricant: lienWhatsApp },
  { id: 'telegram', libelle: 'Telegram', fabricant: lienTelegram },
  { id: 'messenger', libelle: 'Messenger', fabricant: lienMessenger },
  { id: 'signal', libelle: 'Signal', fabricant: lienSignal },
  { id: 'email', libelle: 'Email', fabricant: lienEmail },
  { id: 'mastodon', libelle: 'Mastodon', fabricant: lienMastodon },
] as const;

export type IdFabricantPartage = (typeof FABRICANTS_PARTAGE)[number]['id'];
