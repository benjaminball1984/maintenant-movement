/**
 * Détection de doublons de contenus dans la revue de presse (V2.6.113,
 * demande Ben 2026-06-13).
 *
 * Cas visé : une même actualité publiée par la MÊME source à la fois en
 * vidéo (ou live/podcast) ET en brève texte. Aujourd'hui l'import les crée
 * comme deux cartes distinctes (la dédup existante ne compare que le
 * `source_url` exact, qui diffère entre la page vidéo et la page article).
 * On veut une seule carte : la vidéo, avec le texte de la brève dessous.
 *
 * Module PUR (aucun accès réseau/DB) : il décide seulement, à partir des
 * titres et métadonnées, quels contenus sont des doublons et lequel garder.
 * Réutilisé à la fois par le script de rattrapage (`data-migration`) et par
 * la détection à l'import (prévention des futurs doublons). Entièrement
 * testable.
 *
 * Méthode : on compare les titres par leurs mots significatifs, avec le
 * COEFFICIENT DE RECOUVREMENT (intersection / taille du plus petit), pas le
 * Jaccard : un préfixe « Nom de l'invité : » ou un suffixe « [EXTRAIT] »
 * dilue le Jaccard mais pas le recouvrement, alors que c'est bien le même
 * sujet. Garde-fous : même source obligatoire, fenêtre de dates, et un
 * minimum de mots communs en absolu (anti-coïncidence sur titres courts).
 */

// Plage Unicode des diacritiques combinants (même convention que les autres
// helpers du projet : Biome refuse la classe littérale ̀-ͯ).
const REGEX_DIACRITIQUES = new RegExp(
  `[${String.fromCodePoint(0x0300)}-${String.fromCodePoint(0x036f)}]`,
  'g',
);

/**
 * Mots vides (fr/en/es) de 4 lettres ou plus : ignorés dans la comparaison
 * de titres (les mots de 3 lettres ou moins sont déjà écartés par la
 * longueur minimale).
 */
const MOTS_VIDES = new Set([
  'dans',
  'pour',
  'avec',
  'sans',
  'sous',
  'cette',
  'leur',
  'leurs',
  'plus',
  'moins',
  'tout',
  'tous',
  'toute',
  'toutes',
  'entre',
  'comme',
  'vers',
  'chez',
  'mais',
  'donc',
  'quand',
  'sont',
  'cest',
  'elle',
  'ils',
  'their',
  'with',
  'from',
  'this',
  'that',
  'have',
  'will',
  'your',
  'what',
  'when',
  'they',
  'about',
  'para',
  'como',
  'esta',
  'este',
  'desde',
]);

/** Longueur minimale d'un mot pris en compte dans la comparaison. */
const LONGUEUR_MIN_MOT = 4;

/**
 * Normalise un titre : minuscules, accents retirés, toute ponctuation
 * (guillemets, crochets, deux-points…) remplacée par une espace.
 */
export function normaliserTitreMedia(titre: string): string {
  return titre
    .toLowerCase()
    .normalize('NFD')
    .replace(REGEX_DIACRITIQUES, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Ensemble des mots significatifs d'un titre (dédupliqués). */
export function tokensTitre(titre: string): Set<string> {
  const mots = normaliserTitreMedia(titre)
    .split(' ')
    .filter((m) => m.length >= LONGUEUR_MIN_MOT && !MOTS_VIDES.has(m));
  return new Set(mots);
}

export interface ComparaisonTitres {
  /** Coefficient de recouvrement (intersection / taille du plus petit), 0..1. */
  score: number;
  /** Nombre de mots significatifs communs. */
  communs: number;
}

/** Compare deux titres par leurs mots significatifs (coefficient de recouvrement). */
export function comparerTitres(a: string, b: string): ComparaisonTitres {
  const ta = tokensTitre(a);
  const tb = tokensTitre(b);
  if (ta.size === 0 || tb.size === 0) return { score: 0, communs: 0 };
  let communs = 0;
  for (const mot of ta) if (tb.has(mot)) communs += 1;
  return { score: communs / Math.min(ta.size, tb.size), communs };
}

/**
 * Rang de « richesse » d'un format : on garde le contenu le plus riche d'un
 * groupe de doublons. Une vidéo ou un live (lecture sur place) priment sur
 * un podcast, puis sur une brève, puis sur un dessin (image seule).
 */
export function rangRichesse(type: string): number {
  switch (type) {
    case 'video':
    case 'live':
      return 4;
    case 'podcast':
      return 3;
    case 'breve':
      return 2;
    case 'dessin':
      return 1;
    default:
      // Contenus maison (édito, article, tribune, newsletter) : on ne les
      // fusionne pas automatiquement, mais s'ils apparaissent ils priment.
      return 5;
  }
}

/** Métadonnées minimales d'un contenu pour la détection de doublons. */
export interface MediaDoublon {
  id: string;
  titre: string;
  type: string;
  provenance_externe: string | null;
  corps: string | null;
  publie_le: string | null;
  vignette_url: string | null;
  media_url: string | null;
  tags: string[] | null;
}

export interface GroupeDoublon {
  /** Contenu à garder (le plus riche ; à égalité, le texte le plus long). */
  garde: MediaDoublon;
  /** Contenus doublons à fusionner dans `garde` puis retirer. */
  absorbes: MediaDoublon[];
}

export interface OptionsRegroupement {
  /** Seuil de recouvrement des titres (défaut 0.75). */
  seuil?: number;
  /** Minimum de mots communs en absolu (défaut 4). */
  minCommuns?: number;
  /** Fenêtre de dates entre deux doublons, en jours (défaut 4). */
  fenetreJours?: number;
}

function dateMs(media: MediaDoublon): number {
  if (media.publie_le === null) return 0;
  const t = Date.parse(media.publie_le);
  return Number.isNaN(t) ? 0 : t;
}

function longueurCorps(media: MediaDoublon): number {
  return media.corps?.length ?? 0;
}

/**
 * Regroupe les contenus en doublon : même source, titres très recouvrants,
 * publiés dans une fenêtre de temps proche. Ne renvoie que les groupes d'au
 * moins deux contenus (donc au moins un à absorber).
 *
 * Seuls les contenus à provenance externe (revue de presse) sont comparés :
 * c'est là que naissent les doublons vidéo/brève.
 */
export function regrouperDoublons(
  medias: MediaDoublon[],
  opts: OptionsRegroupement = {},
): GroupeDoublon[] {
  const seuil = opts.seuil ?? 0.75;
  const minCommuns = opts.minCommuns ?? 4;
  const fenetreMs = (opts.fenetreJours ?? 4) * 24 * 3600 * 1000;

  // Regroupement par source (un doublon est toujours d'une même source).
  const parSource = new Map<string, MediaDoublon[]>();
  for (const m of medias) {
    const source = m.provenance_externe;
    if (source === null || source === '') continue;
    const liste = parSource.get(source) ?? [];
    liste.push(m);
    parSource.set(source, liste);
  }

  const groupes: GroupeDoublon[] = [];
  for (const liste of parSource.values()) {
    // Tri chronologique pour des grappes déterministes.
    const triee = [...liste].sort((a, b) => dateMs(a) - dateMs(b));
    const assigne = new Set<string>();
    for (let i = 0; i < triee.length; i += 1) {
      const germe = triee[i];
      if (germe === undefined || assigne.has(germe.id)) continue;
      const grappe: MediaDoublon[] = [germe];
      assigne.add(germe.id);
      for (let j = i + 1; j < triee.length; j += 1) {
        const candidat = triee[j];
        if (candidat === undefined || assigne.has(candidat.id)) continue;
        if (Math.abs(dateMs(candidat) - dateMs(germe)) > fenetreMs) continue;
        const { score, communs } = comparerTitres(germe.titre, candidat.titre);
        if (score >= seuil && communs >= minCommuns) {
          grappe.push(candidat);
          assigne.add(candidat.id);
        }
      }
      if (grappe.length < 2) continue;
      // Garde-fou anti faux-positif : deux contenus de MÊME format aux titres
      // seulement « recouvrants » (ex. deux dessins différents sur le travail,
      // titres courts) ne sont PAS un doublon. On ne fusionne que si le groupe
      // mélange au moins deux formats (vidéo + brève = le cas visé) OU si les
      // titres sont strictement identiques (vrai doublon ré-importé).
      const typesDistincts = new Set(grappe.map((m) => m.type));
      const titreReference = normaliserTitreMedia(germe.titre);
      const titresIdentiques = grappe.every(
        (m) => normaliserTitreMedia(m.titre) === titreReference,
      );
      if (typesDistincts.size < 2 && !titresIdentiques) continue;
      const garde = [...grappe].sort(
        (a, b) =>
          rangRichesse(b.type) - rangRichesse(a.type) || longueurCorps(b) - longueurCorps(a),
      )[0] as MediaDoublon;
      groupes.push({
        garde,
        absorbes: grappe.filter((m) => m.id !== garde.id),
      });
    }
  }
  return groupes;
}

/**
 * Détermine le meilleur corps (texte) pour le contenu gardé : le plus long
 * du groupe (souvent celui de la brève, la vidéo ayant un corps vide). Sert
 * à mettre « 6-7 lignes de texte sous la vidéo ».
 */
export function meilleurCorps(groupe: GroupeDoublon): string {
  const candidats = [groupe.garde, ...groupe.absorbes];
  let meilleur = groupe.garde.corps ?? '';
  for (const m of candidats) {
    const c = m.corps ?? '';
    if (c.length > meilleur.length) meilleur = c;
  }
  return meilleur;
}
