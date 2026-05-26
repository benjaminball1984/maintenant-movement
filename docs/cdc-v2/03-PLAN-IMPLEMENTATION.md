# Plan d'implémentation V2 par dépendances — Maintenant!

> **Fichier** : 03-PLAN-IMPLEMENTATION.md
> **Date** : 2026-05-26 (soir). Signature : LIFE BENJAMIN BALL.
> **But** : ordonner les chantiers V2 par dépendances techniques (pas par espace), pour que Claude Code sache QUOI faire en premier et POURQUOI. Objectif de mai : finir les chantiers ouverts, n'en ouvrir aucun de nouveau au-delà du nécessaire. Donc on privilégie l'additif sans risque et on reporte le lourd.
> **À lire après** : revue d'écarts (doc 1), exigences transversales (doc 1b), pont V1→V2 (doc 2).

---

## Principe d'ordonnancement

Trois critères, dans l'ordre :
1. **Risque données d'abord neutralisé** : ce qui ne touche aucune donnée passe avant ce qui en touche.
2. **Fondations avant usages** : un composant réutilisable (upload, thème, dégradé, réservation, fil de groupe) se pose AVANT les chantiers qui s'en servent.
3. **Greffe additive avant convergence** : tout ce qui s'ajoute à côté passe avant toute fonte dans le tronc Objet (laquelle est reportée).

Les chantiers sont groupés en vagues. Une vague se termine (MANIFEST vert, tests verts) avant la suivante. Numérotation V2 en `V2.x` pour ne pas collisionner avec les phases V1.

---

## VAGUE 0 — Socle de cohérence (aucune donnée touchée, à faire en premier)

But : aligner les consignes et poser les fondations UI. Zéro risque.

- **V2.0.1 — Préséance et CLAUDE.md.** Insérer le bloc de préséance en tête du CLAUDE.md ; appliquer les 3 micro-corrections (sections 1, 3, 11). Déposer le pack CDC V2 dans le repo (ex. `docs/cdc-v2/`). Corriger les 2 coquilles du V2 (« Maintenant Médias » avec S ; amender le §2 régimes A/B).
- **V2.0.2 — Hygiène repo (dette connue, revue 21/05).** Ranger les route groups fantômes (`app/(admin)/`, `app/(auth)/`), supprimer le doublon d'adapter (`lib/stripe/` vestige), poser une CSP réelle dans `next.config.mjs`. Pas de donnée en jeu.
- **V2.0.3 — Fondations UI transversales (ET1-ET4).**
  - Composant `TeleverseurImage` réutilisable (JPEG/PNG/WebP, Supabase Storage, adapter mock par défaut), paramétrable couverture/vignette/icône.
  - Bibliothèque d'images par défaut par type d'objet (curation admin) + logique « défaut sinon upload » (ET1+ET2).
  - Bouton de bascule thème clair/sombre en un geste, branché sur `personne.mode_theme` (ET3).
  - Variant `primary` du composant `Button` central porte le token `--grad` + `--shadow-brand`, deux modes ; règle anti-saturation documentée (ET4).

> À l'issue de la vague 0 : les consignes ne se contredisent plus, et les briques visuelles qui rendent le site « immédiatement beau » sont prêtes à être réutilisées partout.

---

## VAGUE 1 — Greffes additives sans risque données

But : appliquer les corrections de doctrine récentes, par addition. Backfills idempotents `--dry-run`.

- **V2.1.1 — Retrait du wallet intégré (§19).** Retirer `app/(membre)/profil/wallet/` et les bouts de wallet. Conserver/poser : lecture de solde (Polygon, lecture seule, visible par l'utilisateur seul, T99CP + équivalent temps), vérification de hash (existe + bon montant + hash UNIQUE non déjà consommé), redirection vers la home `the99coinproject.org` (jamais d'URL profonde). Via l'adapter `lib/t99cp/`. Zéro donnée.
- **V2.1.2 — Entité `Consentement` + backfill.** Créer la table `consentement` (D8), RLS dans sa propre migration. Backfill depuis `signature_petition` (les `true` seulement), daté du `created_at`, source `backfill_signature_v1`. Colonnes V1 conservées. Compteur intact. Brancher la révocation fine côté profil.
- **V2.1.3 — Table `droit` atomique + presets.** Créer la table `droit` (D10) + liste des `type_droit` (MD1) + presets (les 6 niveaux V1 comme presets). Backfill depuis `droit_admin`. Coexistence : helpers RLS V1 continuent de lire `droit_admin`. Non-élévation + verrou `gerer_droits` (MD3). Aucun droit perdu.

> À l'issue de la vague 1 : la doctrine récente (consentement révocable, droits granulaires, pas de wallet) est en place sans avoir rien cassé.

---

## VAGUE 2 — Composants réutilisables manquants (additifs)

But : poser les composants transversaux que les nouveaux sous-espaces réutiliseront. Pose AVANT les sous-espaces eux-mêmes.

- **V2.2.1 — `FilDeGroupe` (§18).** Fil de discussion collectif distinct du DM, attachable à tout groupe/espace (commune, campagne, GT, groupe d'entraide, covoit'groupe…). Réutilise la messagerie existante.
- **V2.2.2 — `Réservation` réutilisable (D8, §14).** Composant calendrier/disponibilités façon Airbnb/BlaBlaCar + message d'amorce pré-rempli (§14). À brancher sur les offres existantes (transport, hébergement, prêt) et futures.
- **V2.2.3 — `Caisse` + reversements (D7, D12).** Entité `Caisse` (par type de contribution + par cagnotte), `ReceptacleCaisse` datés, transactions sortantes avec justificatif OBLIGATOIRE (D12bis). Régime B. Additif au-dessus de `don`/`cagnotte`.
- **V2.2.4 — Module de partage + Open Graph côté serveur (§10, POINT DUR).** Métadonnées OG (titre + description + IMAGE par défaut ou uploadée) générées CÔTÉ SERVEUR sur chaque page partageable (piège Next.js : les robots OG ne lisent pas le JS). Lecture des OG entrants dans le fil. À TESTER réellement (aperçu WhatsApp/Facebook/X) avant lancement. S'appuie sur ET1 (image toujours présente).

> À l'issue de la vague 2 : les briques transversales du V2 existent. Les nouveaux sous-espaces n'auront qu'à les assembler.

---

## VAGUE 3 — Nouveaux sous-espaces et fonctionnalités V2 (additifs, selon fiches)

But : construire ce que les fiches V2 décrivent et qui n'existe pas encore. Style V1 (table dédiée) tant que la convergence vers le tronc n'est pas décidée, MAIS en réutilisant les composants des vagues 0-2.

- **V2.3.1 — Sous-espaces S'entraider manquants** : hébergement, transport (compléments), prêt « qui prête tout », fruits de la terre, marché solidaire (compléments), groupe d'entraide local. Selon les fiches `03-Sentraider/*`. Réutilisent `Réservation`, `FilDeGroupe`, paiement unifié, `TeleverseurImage`.
- **V2.3.2 — Location mutualisée (§12)** : composant transversal (bus/car/salle), euros exclusivement, organisateur fait tampon (avertissement juridique clair). Applications transport + hébergement.
- **V2.3.3 — Compléments S'informer / Agir** selon les fiches déjà bouclées (Décider, sondages, réseau social affinements ; moments solidaires, commune libre, adhérer). À faire seulement là où le V2 ajoute par rapport au V1 existant.

> Ordre interne de la vague 3 : commencer par le sous-espace le plus simple et le plus universel (ergonomie vitrine, §15), pour roder les composants, puis les cas spécialisés.

---

## VAGUE 4 — Blocs CDC encore non spécifiés (à concevoir AVANT de coder)

Ces blocs sont à 0 % dans le CDC. Ils ne sont PAS prêts pour Claude Code : il faut d'abord finir leur spécification avec Lilou/Ben (sessions CDC), sinon l'agent inventerait du fond (interdit).

- **V2.4.1 — Espace membre / profil** : dashboard, infos, confidentialité, contributions, wallet (lecture seule), notifications.
- **V2.4.2 — Admin / modération (UI)** : consoles, droits (s'appuie sur la table `droit` de V2.1.3), équipes de modération.
- **V2.4.3 — Transverses** : carte unifiée, agenda, notifications (compléments).
- **V2.4.4 — Fondations** : CMS d'édition (texte + images partout, s'appuie sur ET1/ET2), crons/automatisations, délivrabilité (SPF/DKIM/DMARC), déploiement Cloudflare Pages + DNS Ionos.

> Statut : **spécification d'abord, code ensuite.** Claude Code peut préparer le terrain technique (ex. brancher le CMS sur le composant d'upload) mais ne code pas le fond tant que les fiches ne sont pas écrites.

---

## VAGUE 5 — Convergence vers le tronc Objet/Espace (REPORTÉE, décision requise)

But : la grande unification doctrinale (D2, D6). **Ne se lance QUE sur décision explicite et nominative de Lilou/Ben, table par table.** Tant que non décidée : ne pas commencer. Le site V2 est pleinement fonctionnel sans elle.

- Approche recommandée le jour venu : une table métier à la fois, fondue dans le tronc `Objet` derrière une vue de compatibilité, backfill, tests, MANIFEST, puis la suivante. Jamais en bloc.

---

## Récapitulatif de l'ordre

```
VAGUE 0  Socle de cohérence (CLAUDE.md, hygiène, fondations UI)      ← COMMENCER ICI
VAGUE 1  Greffes additives (wallet, consentement, droits)            ← backfills --dry-run
VAGUE 2  Composants réutilisables (fil groupe, réservation, caisse, OG)
VAGUE 3  Nouveaux sous-espaces (S'entraider, location mutualisée…)
VAGUE 4  Blocs non spécifiés (spéc CDC d'abord, code ensuite)
VAGUE 5  Convergence tronc Objet (REPORTÉE, décision nominative)
```

**Pour ce soir** : Claude Code peut démarrer la VAGUE 0 immédiatement, sans aucun risque. C'est exactement « se remettre au travail » sans attendre la moindre décision lourde.
