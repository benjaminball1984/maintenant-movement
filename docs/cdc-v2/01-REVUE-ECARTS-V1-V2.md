# Revue de code et écarts V1 ↔ V2 — Maintenant!

> **Fichier** : 01-REVUE-ECARTS-V1-V2.md
> **Date** : 2026-05-26 (soir). Signature : LIFE BENJAMIN BALL.
> **But** : confronter, point par point, ce que le code V1 fait réellement (lu dans le repo `maintenant-movement`, 46 tables, 41 migrations) avec ce que le CDC V2 décide. Pour chaque écart : sa nature, et sa manœuvre de rattrapage SANS perte de donnée et SANS remise à zéro de compteur.
> **À lire avant** : le pont V1→V2 (doc 2) et le plan d'implémentation (doc 3) en découlent.

---

## 0. Méthode et verdict d'ensemble

Lecture faite sur le code source réel (migrations Supabase, arborescence `lib/` et `app/`), pas sur la mémoire des sessions. Le code V1 est **solide et propre** : TypeScript strict, RLS sur chaque table, pattern adapter sur les 5 API externes, naming métier français cohérent, identité bien modélisée (`personne` lié à `auth.users` + `profil_unifie` pour le M+7).

**Le V2 n'est PAS une description de ce code : c'est une cible doctrinale plus abstraite (tronc+filles, espace générique, droits atomiques) posée par-dessus.** D'où des écarts. Ils se rangent en trois familles :

- **Famille A — Écarts de doctrine récente** (le V2 décide quelque chose que la V1 ne pouvait pas connaître). Rattrapage = greffe additive. La majorité.
- **Famille B — Écarts de modèle profond** (le V2 veut une autre forme de tables). Rattrapage = REPORTÉ, cible doctrinale, pas de chantier maintenant.
- **Famille C — Coquilles et désalignements mineurs** (un mot, un nom). Rattrapage = micro-correction, souvent dans le V2 lui-même.

Aucun écart ne justifie de casser l'existant. Tous se traitent par addition.

---

## 1. ÉCART — Consentements RGPD : deux colonnes en dur vs entité `Consentement` (Famille A)

**Ce que fait la V1** : `signature_petition` porte deux booléens en dur, `accepte_newsletter` et `accepte_contact_createurice`. Pas d'entité de consentement séparée. La date du consentement = le `created_at` de la signature entière. Pas de mécanisme de révocation fine (retirer le consentement newsletter sans toucher la signature).

**Ce que veut le V2** (schéma D8) : une entité `Consentement` granulaire, indépendante, datée, traçable et **révocable** ; chaque case = un consentement distinct, avec `type_consentement`, `objet_id`, `valeur`, `date`, `source`.

**Pourquoi l'écart** : la V1 a modélisé le minimum viable conforme (les deux cases suffisaient à un parcours pétition simple). Le V2 généralise pour la révocabilité et l'export ciblé.

**Manœuvre de rattrapage (sans perte, sans reset)** :
1. Créer la table `consentement` du V2 (granulaire, révocable). **Ne PAS toucher** `signature_petition`.
2. **Backfill une fois** : pour chaque signature où `accepte_newsletter = true`, insérer une ligne `consentement` de type `newsletter_plateforme`, `valeur = true`, `date = signature.created_at`, `source = 'backfill_signature_v1'`, `objet_id = petition_id`. Idem pour `accepte_contact_createurice` → type `contact_createur`. Les `false` ne créent RIEN (ne pas consentir n'est pas un consentement).
3. Les deux colonnes d'origine restent intactes : elles deviennent la **trace figée de l'état initial** (cohérent avec le `snapshot` de la signature, D9). La table `consentement` devient l'**état vivant et révocable**.
4. Le compteur de signatures ne bouge pas : on n'a pas touché `signature_petition`.

**Garde-fou** : le backfill est un script idempotent avec `--dry-run` obligatoire (cf. revue 21/05 §1.6 : les scripts destructeurs sans garde-fou sont un défaut connu du repo, ne pas le reproduire).

---

## 2. ÉCART — Droits : 6 niveaux fixes vs cases à cocher + presets (Famille A)

**Ce que fait la V1** : table `droit_admin` avec un champ `niveau` contraint à 6 valeurs fixes (`national`, `admin`, `moderation`, `tresorerie`, `animation`, `dpd`), un `scope_commune_id` pour l'animation, un `perimetre_onglet[]` pour la modération. Historique conservé (`retire_le`). Helpers RLS `est_admin_general()`, `est_moderateurice(onglet)` bâtis dessus.

**Ce que veut le V2** (matrice MD1, schéma D10) : droits **atomiques** (une permission = une action précise, cases indépendantes), regroupés en **presets** pour l'attribution rapide. Liste de `type_droit` (ecrire_article, moderer_a_priori, gerer_caisse…). Cible précise par `(cible_type, cible_id)` (MD2). Non-élévation + verrou `gerer_droits` (MD3).

**Pourquoi l'écart** : la V1 a choisi des rôles fixes (simple, rapide à coder). Le V2 veut le grain fin du §9 (« délégation granulaire »).

**Manœuvre de rattrapage (sans perte)** :
1. Créer la table `droit` atomique du V2 (`profil_id`, `cible_type`, `cible_id`, `type_droit`, `accorde_par`, dates). **Ne PAS supprimer** `droit_admin`.
2. Définir les **6 niveaux V1 comme presets V2** : `national` = preset qui coche tous les droits ; `moderation` = preset `moderer_a_*` + `traiter_signalement` ; `tresorerie` = `gerer_caisse` + `valider_reversement` + `consulter_journal` ; etc. Les presets du V2 (MD1) étaient DÉJÀ calqués sur ces fonctions : ils tombent juste.
3. Backfill : chaque ligne active de `droit_admin` génère les lignes `droit` atomiques correspondant à son preset. Les helpers RLS V1 continuent de lire `droit_admin` tant que tout n'est pas basculé (coexistence).
4. Personne ne perd ses droits ; on en gagne le grain fin pour les nouveaux espaces.

**Point d'attention sécurité** (revue 21/05 §1.7) : les policies RLS sont déportées dans une migration unique (`_011`). En ajoutant la table `droit`, NE PAS reproduire ce couplage temporel : poser la RLS de `droit` DANS sa propre migration.

---

## 3. ÉCART — Anonymat des dons : autorisé en V1 vs profil obligatoire en V2 (Famille A)

**Ce que fait la V1** : `don.personne_id` est nullable (don anonyme possible). On stocke prénom/nom/email/code_postal déclarés au formulaire pour reçu fiscal et dédoublonnage.

**Ce que veut le V2** (schéma D11) : jamais d'anonymat administratif. Un don au mouvement crée ou rattache TOUJOURS un profil. Le donateur peut seulement **masquer son nom à l'affichage** (`afficher_nom = false`), pas être administrativement anonyme.

**Pourquoi l'écart** : la V1 visait la friction minimale (donner sans compte). Le V2 resserre pour la conformité (reçus fiscaux, anti-blanchiment, sérénité de contrôle).

**Manœuvre de rattrapage (sans perte, sans toucher au passé)** :
1. Les dons existants restent tels qu'ils ont été collectés. **On ne réécrit pas l'histoire.** Un don V1 anonyme reste anonyme dans la base.
2. La règle D11 s'applique **aux nouveaux dons uniquement** : à partir de la bascule, tout don crée/rattache un `profil_unifie` (le mécanisme existe déjà, migration 038) ; ajouter un champ `afficher_nom`.
3. Optionnel et non destructeur : pour les anciens dons avec email, on PEUT (script idempotent, `--dry-run`) rattacher rétroactivement à un `profil_unifie` par email, sans rien supprimer. À décider, non bloquant.

**À valider Légicoop** (déjà dans la liste juridique du V2) : conditions des reçus fiscaux, seuils de déclaration, cas du don en 99-coin.

---

## 4. ÉCART — Anonymat des signatures : autorisé en V1, cohérent ou non avec D11 ? (Famille A, mineur)

**Ce que fait la V1** : `signature_petition.personne_id` nullable (signature anonyme sans compte). Mais un `profil_unifie` est tout de même créé/trouvé par email à la signature (migration 038). Donc en pratique, une signature a déjà une identité durable même sans compte.

**Ce que veut le V2** : D11 vise les DONS, pas les signatures. Une signature n'est pas un flux d'argent. L'anonymat de signature (sans compte) est légitime et reste.

**Verdict** : **pas un vrai écart.** Le `profil_unifie` couvre déjà le besoin d'identité durable. Rien à faire. Noté pour lever l'ambiguïté.

---

## 5. ÉCART — Wallet intégré : présent en V1, à retirer en V2 (Famille A, action nette)

**Ce que fait la V1** : il existe `app/(membre)/profil/wallet/page.tsx` et des traces de wallet dans `lib/t99cp/`. Le principe §19 du V2 est explicite : AUCUN wallet intégré ; paiement par redirection vers la home `the99coinproject.org` ; vérification en lecture sur Polygon ; jamais d'URL profonde.

**Ce que veut le V2** (§19) : retirer entièrement le wallet intégré. Garder uniquement : affichage du solde en lecture (Polygon), vérification de hash (existe + bon montant + hash unique non déjà consommé), redirection vers la home.

**Manœuvre de rattrapage** : chantier additif/soustractif PROPRE (pas une donnée en jeu, c'est du code) : retirer la page wallet et les bouts de wallet intégré ; conserver/installer la lecture de solde et la vérification de hash via l'adapter `lib/t99cp/` (déjà en place, mock par défaut). C'est un des premiers chantiers, sans risque données.

---

## 6. ÉCART — Principe §2 « jamais l'argent » : faux en l'état (Famille C, déjà acté)

**Ce que dit le V2 (à amender)** : le §2 des principes transversaux affirme « Maintenant! ne touche JAMAIS l'argent ». Le V2 lui-même (décision D7) corrige : c'est vrai en régime A (entre personnes), faux en régime B (collecte vers le mouvement : adhésions, cotisations, dons, cagnottes → l'argent arrive bien à Maintenant!, sur le Stripe existant aujourd'hui).

**Ce que fait la V1** : la table `don` et la table `cagnotte` collectent déjà vers le mouvement (régime B), avec frais 5 % euros absorbés par le donateur. Donc **la V1 fait DÉJÀ du régime B.** Le code est en avance sur le principe écrit.

**Manœuvre** : micro-correction documentaire. Amender le §2 du fichier `principes-transversaux-V2.md` pour intégrer les deux régimes A/B (texte déjà rédigé dans la session du soir). Aucun code à changer. C'est le V2 qui se met à jour, pas la V1.

---

## 7. ÉCART — Vocabulaire « Maintenant Média » vs « Maintenant Médias » (Famille C, coquille)

**Ce que fait la V1** : `03_VOCABULAIRE.md` fixe **« Maintenant Médias »** (avec S), avec une note explicite « Pas Maintenant Média ». Le code suit.

**Ce que faisait le V2 (avant correction V2.0.1)** : la fiche `maintenant-media-V2.md` et plusieurs sessions écrivaient « Maintenant Média » (sans S).

**Verdict** : le **vocabulaire V1 prime** (cf. bloc de préséance). Corriger le V2, pas la V1. Micro-coquille, à reprendre dans la fiche V2. Aucun impact code.

**Statut** : **CORRIGÉ par V2.0.1** (2026-05-26 soir). Fiche renommée `maintenant-medias-V2.md`. Toutes les occurrences textuelles « Maintenant Média » alignées sur « Maintenant Médias » dans le pack CDC V2, sauf les mentions explicites du choix de nommage (qui restent pour traçabilité).

---

## 8. ÉCART — Modèle tronc `Objet` / `Espace` générique / ESM+5 (Famille B, REPORTÉ)

**Ce que fait la V1** : tables métier séparées (`petition`, `mobilisation`, `cagnotte`, `commune`, `federation`, `confederation`, `gt_thematique`, `campagne`, `offre_entraide`, `service_sel`, `produit_marche`, `moment_solidaire`…). Identifiant public : `M+7` pour les personnes (`profil_unifie`). Pas d'`ORM+5` ni d'`ESM+5`.

**Ce que veut le V2** (D2, D6, D13) : tronc commun `Objet` + `config` JSON + tables filles ; `Espace` générique (`type` + `config` + `OutilActivé`) ; rattachement en graphe pur ; identifiants `ORM+5` (organisations) et `ESM+5` (espaces).

**Pourquoi l'écart** : c'est le cœur de la refonte doctrinale. La V1 a une vingtaine de tables métier indépendantes ; le V2 veut les unifier sous un tronc.

**Manœuvre de rattrapage** : **AUCUNE pour l'instant. C'est une CIBLE, pas un chantier.** (Doctrine de greffe, interdit n°3.) Cette convergence :
- ne se fait QUE sur décision explicite et nominative de Lilou/Ben, chantier par chantier ;
- se fait table par table, jamais en bloc ;
- chaque table fondue dans le tronc garde une vue de compatibilité pour ne rien casser en amont ;
- les nouveaux identifiants (`ORM+5`, `ESM+5`) peuvent, eux, être posés de façon additive quand on créera les premières organisations/espaces génériques, en réutilisant le générateur de `profil_unifie` (M+7) déjà éprouvé (anti-collision, anti-gros-mots).

**Tant que cette décision n'est pas prise, les nouveaux espaces V2 (groupe d'entraide local, etc.) se construisent avec le style V1 (table dédiée si besoin), en restant compatibles avec la cible.** On ne bloque pas l'avancement sur une refonte non décidée.

---

## 9. Défauts V1 connus à NE PAS reproduire en greffant (rappel revue 21/05)

La revue du 21/05 a relevé des défauts encore partiellement ouverts. À garder en tête pour ne pas les aggraver :
- **Route groups fantômes** : `app/(admin)/` (vide) vs `app/admin/` (actif) ; `app/(auth)/` vs `app/auth/`. Risque de collision. Ranger avant d'ajouter des routes.
- **Doublon d'adapter paiement** : `lib/payments/` (prod) vs `lib/stripe/` (1 test). Nettoyer le vestige.
- **Scripts destructeurs sans `--dry-run`** (`import-communes`, `migrer-base44`). Tout nouveau script de backfill DOIT avoir `--dry-run` + confirmation.
- **RLS déportée dans une migration unique** : poser la RLS de chaque nouvelle table DANS sa propre migration.
- **Couleurs en dur hors tokens** (popup MapLibre, fond 2FA) : respecter `04_DESIGN-TOKENS.md`.
- **Placeholders `[TEXTE À FAIRE]` visibles en prod** dans 8 pages éditoriales (2.2) : bloqués tant que Lilou/Ben ne fournit pas les textes ; afficher une bannière neutre, pas le placeholder brut.

---

## 10. Synthèse : tableau des écarts

| # | Écart | Famille | Rattrapage | Bloquant ? |
|---|---|---|---|---|
| 1 | Consentements RGPD (2 colonnes → entité) | A | Table `consentement` + backfill, colonnes gardées | Non |
| 2 | Droits (6 niveaux → cases + presets) | A | Table `droit` atomique + presets = niveaux V1 + backfill | Non |
| 3 | Anonymat des dons | A | Règle D11 sur nouveaux dons ; passé intact | Non |
| 4 | Anonymat des signatures | A (faux écart) | Rien (profil_unifie couvre déjà) | Non |
| 5 | Wallet intégré | A | Retrait code + lecture solde/hash via adapter | Non, prioritaire |
| 6 | §2 « jamais l'argent » | C | Amender le texte du V2 (régimes A/B) | Non |
| 7 | « Maintenant Média » vs « Médias » | C | Corriger le V2, vocabulaire V1 prime | Non |
| 8 | Tronc Objet / Espace / ESM+5 | B | REPORTÉ, cible doctrinale, décision requise | Non (ne pas faire) |

**Conclusion** : aucun écart n'impose de casser l'existant. Sept des huit se traitent par greffe additive ou micro-correction. Le huitième (le grand modèle) est explicitement reporté. La V2 peut donc démarrer ce soir sur les chantiers additifs.
