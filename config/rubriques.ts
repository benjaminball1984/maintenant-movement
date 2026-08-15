/**
 * Interrupteurs de rubriques — quelles parties du site sont allumées.
 *
 * ## Pourquoi ce fichier existe
 *
 * Décision de Lilou/Ben (01/08/2026) : le site montrait cinq espaces et
 * ~165 pages, dont beaucoup vides ou marquées « en construction ». Un
 * visiteur naviguait sans rien trouver. On ne garde donc allumé que ce
 * qui a du contenu réel, et on **met le reste en sommeil**.
 *
 * « En sommeil » ≠ « supprimé ». Conformément à la doctrine de greffe
 * (CLAUDE.md §0.3, « on additionne, on ne soustrait jamais ») :
 *   - aucun code n'est effacé, aucune table n'est touchée ;
 *   - les pages existent toujours dans `app/`, elles sont seulement
 *     rendues inatteignables ;
 *   - rallumer une rubrique = déplacer une ligne de {@link CHEMINS_SOMMEIL}
 *     vers {@link CHEMINS_ACTIFS} (et, si elle doit revenir au menu,
 *     l'ajouter à {@link RUBRIQUES_MENU}). Aucun autre fichier à modifier.
 *
 * ## Qui lit ce fichier
 *
 * - `middleware.ts` — renvoie vers l'accueil toute adresse en sommeil.
 * - `components/layout/Header.tsx` — construit le menu principal.
 * - `components/layout/Footer.tsx` — construit les liens de pied de page.
 * - `lib/recherche/` — restreint la recherche globale aux rubriques actives.
 * - `components/admin/` — masque les entrées d'administration devenues inutiles.
 *
 * ## Règle de résolution
 *
 * Une adresse est comparée aux deux listes ; **le préfixe le plus long
 * gagne**. Ce qui n'est listé nulle part reste actif : on n'éteint jamais
 * par accident (les routes techniques `/api`, `/auth`, les pages d'erreur
 * continuent de fonctionner sans qu'on ait à les déclarer).
 *
 * Exemple : `/mobiliser` est en sommeil (l'ancienne page d'espace), mais
 * `/mobiliser/petitions` est actif — le préfixe le plus long l'emporte.
 */

/** Une entrée du menu principal. */
export interface RubriqueMenu {
  /** Identifiant technique, stable (sert de clé React et de clé CMS). */
  cle: string;
  /** Libellé affiché dans le menu. */
  libelle: string;
  /** Adresse de la page d'index de la rubrique. */
  href: string;
}

/**
 * Les cinq rubriques du menu principal, dans l'ordre d'affichage.
 *
 * Ordre voulu par Lilou/Ben : du geste le plus facile au plus
 * contemplatif — on signe, on se retrouve, on donne, on donne son avis,
 * on s'informe.
 *
 * Les adresses restent celles d'origine (`/mobiliser/…`, `/s-informer/…`)
 * même si le menu est désormais à plat : changer une URL casserait les
 * liens déjà partagés et le référencement acquis.
 */
export const RUBRIQUES_MENU: ReadonlyArray<RubriqueMenu> = [
  { cle: 'petitions', libelle: 'Pétitions', href: '/mobiliser/petitions' },
  { cle: 'mobilisations', libelle: 'Mobilisations', href: '/mobiliser/mobilisations' },
  { cle: 'sondages', libelle: 'Sondages', href: '/s-informer/sondages' },
  { cle: 'medias', libelle: 'Maintenant Médias', href: '/s-informer/media' },
  // ↓↓↓ POUR RALLUMER LES CAGNOTTES ↓↓↓
  // Décision Lilou/Ben du 01/08/2026 : la rubrique est endormie parce
  // qu'aucune cagnotte n'est publiée et que l'encaissement n'est pas
  // encore branché. Deux gestes pour la rallumer, dans cet ordre :
  //   1. décommenter la ligne ci-dessous ;
  //   2. retirer '/mobiliser/cagnottes' de CHEMINS_SOMMEIL, plus bas.
  // (Le bouton « donner » se rallumera de lui-même dès que les clés
  //  Stripe seront posées — voir `paiementReelDisponible`.)
  // { cle: 'cagnottes', libelle: 'Cagnottes', href: '/mobiliser/cagnottes' },
] as const;

/**
 * Chemins publics actifs en dehors du menu principal.
 *
 * On les déclare explicitement parce qu'ils vivent sous un préfixe mis
 * en sommeil : sans cette liste, `/mobiliser/petitions` tomberait avec
 * `/mobiliser`.
 */
export const CHEMINS_ACTIFS: ReadonlyArray<string> = [
  // Les cinq rubriques du menu (répétées ici pour que la résolution
  // d'adresse ne dépende pas de l'ordre de lecture des deux constantes).
  '/mobiliser/petitions',
  '/mobiliser/mobilisations',
  '/s-informer/sondages',
  '/s-informer/media',

  // Adhésion : gardée, mais uniquement l'adhésion gratuite
  // (les chemins payants sont en sommeil, voir CHEMINS_SOMMEIL).
  '/agir/adherer',

  // Pages transverses gardées.
  '/agenda', // alimenté par les mobilisations
  '/recherche', // restreinte aux rubriques actives
  '/dons/retour', // page de retour après un paiement

  // Obligations légales et contact.
  '/mentions-legales',
  '/confidentialite',
  '/contact',
] as const;

/**
 * Chemins mis en sommeil : plus aucun lien vers eux, et toute visite
 * directe est renvoyée vers l'accueil.
 *
 * Chaque ligne porte la raison de l'extinction, pour qu'on sache quoi
 * vérifier avant de rallumer.
 */
export const CHEMINS_SOMMEIL: ReadonlyArray<string> = [
  // — Anciennes pages d'espace : le menu est désormais à plat, ces pages
  //   intermédiaires ne mèneraient qu'à une seule rubrique chacune.
  '/mobiliser',
  '/s-informer',
  '/agir',
  '/comprendre',

  // — Mobiliser : les campagnes (dossier reliant plusieurs outils).
  '/mobiliser/campagnes',

  // — Cagnottes : aucune cagnotte publiée à ce jour, et l'encaissement
  //   n'est pas encore branché. À rallumer en même temps que la ligne
  //   commentée dans RUBRIQUES_MENU (voir ci-dessus).
  '/mobiliser/cagnottes',

  // — S'informer : rubriques sans contenu publié à ce jour.
  '/s-informer/journal', // aucun numéro publié
  '/s-informer/radio', // page marquée « en construction »
  '/s-informer/decider', // aucune réunion programmée, visio non branchée
  '/s-informer/reseau', // réseau social : sans communauté active, il sonne creux

  // — S'entraider : l'espace entier (~30 pages), aucune annonce réelle.
  '/s-entraider',

  // — La carte des mobilisations, mise en sourdine le 15/08/2026
  //   (décision Lilou/Ben). Les mobilisations restent visibles dans leur
  //   rubrique et dans l'agenda : c'est la vue cartographique qui est
  //   éteinte, pas la donnée. Le géocodage des mobilisations importées
  //   continue de tourner, donc la carte sera à jour le jour où on la
  //   rallume (remettre '/cartes' dans CHEMINS_ACTIFS et rétablir le lien
  //   dans le pied de page, `components/layout/Footer.tsx`).
  '/cartes',

  // — Agir, hors adhésion.
  '/agir/adherer/euros', // adhésion payante : remplacée par l'adhésion unique et gratuite (15/08/2026)
  '/agir/adherer/t99cp', // paiement en 99-coin : demande un portefeuille crypto
  '/agir/assemblee',
  '/agir/autres-moyens', // page marquée « liste en construction »
  '/agir/communes', // communes libres : pas encore de groupes locaux constitués
  '/agir/confederations',
  '/agir/federations',
  '/agir/moments-solidaires',
  '/agir/depuis-petition',

  // — Annuaires et pages de contenu non finalisées.
  '/communes', // annuaire des 35 011 communes
  '/organisations', // annuaire des organisations alliées
  '/co-construire',
  '/a-propos', // texte à reprendre avant de le remontrer

  // — Espace membre : onglets ramenés de 11 à 4 (cf. le layout du profil).
  //   Ces sept pages ne desservaient que des rubriques endormies.
  '/profil/dashboard',
  '/profil/mes-groupes',
  '/profil/communes',
  '/profil/reservations',
  '/profil/demandes-reservations',
  '/profil/notifications',
  '/profil/notifications-recues',
  '/profil/decider',

  // — Doublons et pages techniques qui n'ont rien à faire en public.
  '/carte', // doublon de /cartes
  '/cartes/hebergements', // couche hébergement solidaire (espace éteint)
  '/design-system', // page de démonstration des composants
  '/dons/mock', // simulateur de paiement : ne doit JAMAIS être atteignable en ligne
] as const;

/** Préfixes techniques que le sommeil ne doit jamais toucher. */
const CHEMINS_TECHNIQUES: ReadonlyArray<string> = ['/api', '/auth', '/_next'] as const;

/**
 * Longueur du plus long préfixe de `chemins` qui correspond à `pathname`.
 * Retourne `-1` si aucun ne correspond.
 *
 * Un préfixe correspond si le chemin lui est égal, ou s'il en descend
 * (`/agir` correspond à `/agir/communes`, mais pas à `/agirons`).
 */
function longueurCorrespondance(pathname: string, chemins: ReadonlyArray<string>): number {
  let meilleure = -1;
  for (const prefixe of chemins) {
    const correspond = pathname === prefixe || pathname.startsWith(`${prefixe}/`);
    if (correspond && prefixe.length > meilleure) {
      meilleure = prefixe.length;
    }
  }
  return meilleure;
}

/**
 * Cette adresse est-elle mise en sommeil ?
 *
 * @param pathname Chemin de l'URL, sans domaine ni paramètres (ex. `/agir/communes`).
 * @returns `true` si la visite doit être renvoyée vers l'accueil.
 */
export function estEnSommeil(pathname: string): boolean {
  if (longueurCorrespondance(pathname, CHEMINS_TECHNIQUES) >= 0) {
    return false;
  }
  const sommeil = longueurCorrespondance(pathname, CHEMINS_SOMMEIL);
  if (sommeil < 0) {
    return false;
  }
  // Le préfixe le plus long gagne : `/mobiliser/petitions` (actif, 21
  // caractères) l'emporte sur `/mobiliser` (sommeil, 10 caractères).
  return longueurCorrespondance(pathname, CHEMINS_ACTIFS) < sommeil;
}
