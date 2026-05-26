# Exigences transversales V2 — UI et médias

> **Fichier** : 01b-EXIGENCES-TRANSVERSALES-UI.md
> **Date** : 2026-05-26 (soir). Signature : LIFE BENJAMIN BALL.
> **Rôle** : quatre exigences qui s'appliquent à TOUS les chantiers (pas à un seul). Elles ne touchent pas le modèle de données : elles relèvent des composants réutilisables et des design tokens. Le prompt d'amorce et la revue y renvoient.
> **Préséance** : le vocabulaire (`03_VOCABULAIRE.md`) et les design tokens (`04_DESIGN-TOKENS.md`) priment. Ces exigences précisent COMMENT les appliquer, elles ne les contredisent pas.

---

## ET1 — Image par défaut systématique (pilier esthétique, PAS un fallback technique)

C'est une exigence à part entière, pas un bouche-trou. C'est ce qui rend le site **immédiatement beau au lancement**, avant tout upload.

- **Tout objet partageable a TOUJOURS une image**, même si personne n'en a mis. Jamais d'objet sans image.
- Images par défaut : **vraies images** (pas des pictogrammes), **libres de droit**, **génériques par TYPE d'objet** (une image « pétition », une « cagnotte », une « événement », une « offre marché »…), pas spécifiques au contenu.
- Constituer une **bibliothèque d'images par défaut par type d'objet**, curée par l'admin.
- Lien direct avec les métadonnées Open Graph (principe §10 du V2) : un objet sans image = aperçu de partage vide = zéro clic. L'image par défaut garantit qu'un partage est toujours présentable.
- Conforme au §11 des principes transversaux V2 (rien de changé, on le confirme et on l'érige en exigence forte).

## ET2 — Upload d'images partout (complète ET1, ne la remplace pas)

- Partout où une image est possible (couverture, vignette/description, icône…), il faut un **vrai bouton d'upload**, pas un champ « collez l'URL ». Le champ URL est exclu : il suppose que la personne héberge son image ailleurs, ce qui exclut la plupart des gens.
- Formats acceptés : **JPEG, PNG, WebP** (et formats d'image courants raisonnables).
- Stockage : **Supabase Storage** (déjà dans la stack, CLAUDE.md §6). Adapter mock par défaut (stockage local en dev) cohérent avec le reste.
- **Un seul composant réutilisable** (DRY), ex. `TeleverseurImage`, paramétrable par rôle : `couverture` / `vignette` / `icone`. Réutilisé par tout objet et tout espace.
- **Articulation ET1 ↔ ET2, règle d'or** : *l'image par défaut est le filet de sécurité visuel permanent ; l'upload est le remplacement volontaire. Si la personne uploade, son image remplace la défaut pour cet objet ; sinon la défaut reste. Jamais d'objet sans image, jamais d'obligation d'uploader.*
- Garde-fous techniques : validation du type réel du fichier (pas seulement l'extension), limite de taille raisonnable, recadrage/redimensionnement côté upload si nécessaire pour les vignettes, respect RLS (qui peut uploader sur quel objet).

## ET3 — Bascule mode clair / mode sombre en un geste

- Un **bouton de bascule clair/sombre visible et accessible en un geste**, pas enfoui dans un sous-menu de réglages. Présent dans la barre de navigation principale.
- Écrit la préférence dans `personne.mode_theme` (colonne déjà existante : `auto` / `light` / `dark`) et applique le thème via les tokens existants (`styles/tokens.css` gère déjà les deux modes + `auto` via `prefers-color-scheme`).
- Le mode `auto` (suivre le système) reste l'option par défaut ; le bouton permet de forcer clair ou sombre.
- Vérifier que TOUT nouveau composant respecte les deux modes (rappel revue 21/05 : des couleurs en dur hors tokens cassaient le mode sombre, ne pas reproduire).

## ET4 — Dégradé signature : généraliser sans alourdir

Le dégradé n'est pas à inventer : il **existe déjà comme token propre** dans `styles/tokens.css` et `04_DESIGN-TOKENS.md`, en versions clair ET sombre. Il est aujourd'hui **sous-utilisé**. Consigne : le généraliser.

- **Tokens existants** : `--grad` (violet `#7C3AED` → magenta `#E11D74` → framboise `#DC2654`, 135°), plus `--grad-r`, `--grad-soft`, `--grad-dark`, et l'ombre dédiée `--shadow-brand`. Versions éclaircies distinctes en mode sombre. **Ne PAS toucher aux tokens**, juste les appliquer plus largement.
- **Action** : le variant `primary` du composant central `components/ui/Button.tsx` porte `--grad` + `--shadow-brand`, dans les deux modes. Ainsi tout bouton d'action principale hérite du dégradé via le composant, sans effort et sans duplication (DRY).
- **Étendre avec mesure** à quelques accents : badges (le badge « ✨ Vous » est déjà prévu en gradient dans la spec), en-têtes de section ponctuels, éléments identitaires. Possible aussi ailleurs, tant que ça ne surcharge pas.
- **RÈGLE D'OR (garde-fou anti-saturation)** : *le dégradé est le point fort, pas le fond sonore. Il est réservé à l'action primaire et à des accents choisis. Les actions secondaires restent neutres (bordure, fond uni discret). Si tout est en dégradé, l'identité disparaît.* C'est l'équilibre demandé : le maximum de boutons d'action primaire en dégradé, mais sans lourdeur.
- Cohérence des deux modes : vérifier que le dégradé « claque » aussi bien sur fond crème (clair) que sur fond noir chaud (sombre), comme le pose déjà la spec de design.

---

## Où ces exigences s'appliquent

ET1 à ET4 ne sont PAS un chantier isolé : ce sont des **invariants** que chaque chantier doit respecter. À chaque fin de chantier, la checklist d'exhaustivité (CLAUDE.md §4) inclut implicitement : les images ont une défaut + un upload (ET1/ET2), le rendu est correct dans les deux thèmes (ET3), les boutons d'action primaire portent le dégradé (ET4). Toutefois, poser le socle (le composant `TeleverseurImage`, le bouton de thème, le variant `primary` en dégradé) est un **chantier de fondation précoce** : voir le plan d'implémentation.
