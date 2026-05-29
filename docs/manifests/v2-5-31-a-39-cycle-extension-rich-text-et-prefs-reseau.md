# Manifest groupé — Cycle V2.5.31 → V2.5.39 : extension rich text + préfs notif réseau email

**Date de fin** : 2026-05-29
**Branche** : `main`
**Commit final** : `572fd41`
**Durée approximative** : ~2h sessions Claude Code.

## Objectif

Suite directe du cycle V2.5.23→V2.5.30 (rich text + logo). Trois objectifs :

1. **Convertisseur Markdown → HTML** pour préserver le contenu au bascule Markdown→Riche.
2. **Étendre le rich text à toutes les surfaces longues** où ça a du sens : journal-affiche (articles), Décider (OJ + PV).
3. **Système de préférences notif réseau email** (sous-chantier V2.5.30.a) : la personne choisit pour chacun des 3 types de notif réseau (message reçu / post commenté / post soutenu) un mode parmi 5 (cloche / mail immédiat / digest quotidien / digest hebdo / aucune).

## Livré

### V2.5.31 — Convertisseur Markdown → HTML (commit `82f3e29`)

- [x] **`lib/rich-text/markdown-vers-html.ts`** : `markdownLegerEnHtml(texte): string` retourne du HTML minimal compatible TipTap. Couvre titres `## ` / `### `, listes `- `, paragraphes, inline `**gras**` / `*italique*`. Échappement HTML sur le texte pour éviter injection.
- [x] **Branchement dans `ContenuEditableAdmin` + `EditeurInlineCMS`** : au bascule Markdown → Riche, pré-remplit le HTML vide avec la conversion du Markdown courant. Plus de perte de contenu.
- [x] **16 nouveaux tests** : structures de blocs (paragraphes/listes/titres), inline (**, *), échappement HTML, document réaliste complet.

### V2.5.32 — Polish console CMS (commit `05b0e48`)

- [x] **Badge brand-tint « Riche »** à côté de la clé quand `valeur_html` posée — l'admin repère en un coup d'œil les contenus avec version riche.
- [x] **Aperçu textuel intelligent** : strip des balises HTML pour afficher les 60 premiers caractères du texte (proche de ce que voit le visiteur).
- [x] **Compteur de caractères** bascule sur la longueur de la version active (md ou html).

### V2.5.33 — Rich text étendu au journal-affiche (commit `6eb39a1`)

- [x] **Migration `20260530600000_journal_affiche_contenu_html.sql`** : colonne `contenu_html` nullable additive.
- [x] **Server Actions `creerEditionJournalAction` / `mettreAJourEditionAction`** : acceptent `contenu_html` optionnel avec sanitization via `sanitizeRichHtml`. Vide = efface (retour Markdown).
- [x] **`FormulaireMajEdition`** gagne le switch Riche/Markdown avec pré-remplissage automatique au bascule via `markdownLegerEnHtml`.
- [x] **Page article `/s-informer/journal/[slug]`** priorise `contenu_html` (déjà sanitizé) via `dangerouslySetInnerHTML`, fallback `MarkdownLeger` sur `contenu_md`.

### V2.5.34 — Mise à jour CLAUDE.md V2.5.30 → V2.5.33 (commit `00f760c`)

- [x] Section §11 État courant enrichie.

### V2.5.35 — Infrastructure rich text Décider (commit `03f05c7`)

- [x] **Migration `20260530700000_reunion_decider_html.sql`** : colonnes `ordre_jour_html` et `pv_html` nullable additives.
- [x] **`app/actions/decider.ts`** : schemas Zod `creerReunion` et `majReunion` acceptent les champs HTML optionnels avec sanitization. Mises à jour partielles préservées (vide = efface, undefined = inchangé).
- [x] **Types `types/database.ts`** enrichis.

### V2.5.36 — Tests intégration md → html → sanitize (commit `c887bee`)

- [x] **2 tests anti-régression** sur le pipeline réel : sortie du convertisseur passe par `sanitizeRichHtml` sans perte des balises légitimes ; échappement HTML protège contre injection `<script>` (texte inerte préservé entre `&lt;` `&gt;`).

### V2.5.37 — UI rich text Décider OJ + PV (commit `0aac684`)

- [x] **`FormulaireMajReunion`** : composant `SwitchMode` réutilisable, OJ et PV éditables indépendamment en Riche ou Markdown. Pré-remplissage au bascule via `markdownLegerEnHtml`.
- [x] **`lib/decider.ts`** : interface `ReunionDecider` enrichie avec `ordreJourHtml` et `pvHtml`. 4 maps (lister/lister prochaines/lister dernières/charger par id) renvoient ces champs.
- [x] **Page `/s-informer/decider/[slug]/[reunionId]`** : OJ et PV priorisent `contenu_html` avec classes `prose`, fallback Markdown léger.

### V2.5.38 — Préfs notif réseau email — schéma + UI (commit `c6762a3`)

- [x] **`modeNotifReseauSchema`** : enum `cloche` / `mail_immediat` / `digest_quotidien` / `digest_hebdo` / `aucune`.
- [x] **`preferencesNotificationsSchema`** étendu avec 3 prefs réseau (`reseau_message_recu`, `reseau_post_commente`, `reseau_post_soutenu`). Pas de `.default()` Zod (casse l'inférence react-hook-form), fallback géré à la lecture.
- [x] **`PREFERENCES_NOTIFICATIONS_DEFAUT`** enrichi : les 3 prefs réseau à `'cloche'` (comportement actuel préservé).
- [x] **Lecture page** fait un merge avec DEFAUT plutôt que d'écraser les vieilles prefs si elles n'ont pas les nouveaux champs.
- [x] **UI `FormulaireNotifications`** : nouvelle section « Notifications du réseau social » avec 3 sélecteurs (1 par type). Composant `SelecteurMode` réutilisé. Les digests sont visibles mais étiquetés « à venir » (cron de regroupement pas encore branché).
- [x] **13 nouveaux libellés éditables CMS** (légende, libellé/aide par type, option par mode, hint digest).

### V2.5.39 — Branchement routage cloche/email selon prefs réseau (commit `572fd41`)

- [x] **`lib/preference-notif-reseau.ts`** :
  - `lirePrefNotifReseau(destinatairePersonneId, type)` : lit la pref. Fallback `'cloche'` si pas de pref, lecture échouée, ou parse invalide.
  - `lireEmailPersonne(personneId)` : récupère l'email pour envoi mail.
- [x] **Branchement dans `poserNotificationTemplee`** : si le type appartient à `TYPES_RESEAU` :
  - `mode='aucune'` : early return (ni cloche ni email).
  - `mode='cloche'` (défaut) / `digest_*` : cloche posée seule (digests tombent en cloche en attendant le cron).
  - `mode='mail_immediat'` : cloche posée + envoi mail via `envoyerEmailTemplee`. Échec silencieux pour ne pas casser la cloche.
- [x] Pas de régression sur les autres types de notifs (reservation, moderation, info_groupe...) : cloche systématique inchangée.

## Non livré (volontairement reporté)

- [ ] **Cron de regroupement pour les digests quotidien/hebdo**. Les modes sont définis et visibles dans l'UI, mais ils tombent en `cloche` à l'exécution. Pour activer : créer un cron (Cloudflare Worker ou Supabase Edge Function planifiée) qui lit les notifs des dernières 24h/7j filtrées par `pref=digest_*`, regroupe par destinataire, envoie un email récap. ~3h. **V2.5.40.a**.
- [ ] **Migration progressive automatique des contenus existants vers le mode riche**. Toujours possible manuellement via clic « Riche » sur chaque clé. Un script `npx tsx scripts/convertir-tout-en-riche.ts --dry-run` qui passerait tous les `contenu_editorial.valeur_md` non vides au convertisseur md→html et écrirait dans `valeur_html` serait utile. ~30 min. **V2.5.40.b**.
- [ ] **Extension rich text aux profils, communes, fédérations, mobilisations, pétitions, cagnottes**. Pour ces tables, les utilisateurice·s décrivent leur initiative en texte plat / Markdown léger. Un mode rich text serait utile pour les descriptions longues. Schéma additif (colonne `description_html`) + Server Action + UI éditeur par formulaire. ~30 min par table. **V2.5.40.c à V2.5.40.h**.

## Décisions techniques

- **Pas de table dédiée pour les prefs notif réseau** : on étend le blob `personne.preferences_visibilite.notifications` qui existe déjà. Greffe additive minimale, pas de nouvelle migration nécessaire, pas de jointure supplémentaire à la lecture.
- **Pas de `.default()` Zod** sur les prefs : ça rend le champ optionnel à l'input et casse l'inférence de `react-hook-form` (qui passe en `FieldValues` générique). Le fallback se fait dans la lecture côté page via merge avec `DEFAUT`.
- **Lecture-puis-merge** pour ne pas écraser les vieilles prefs : si la pref existante n'a pas les nouveaux champs, on les complète avec DEFAUT au lieu de tout remplacer par DEFAUT (qui perdrait les choix push/mardi/vendredi historiques).
- **`SwitchMode` dupliqué dans `FormulaireMajReunion`, `FormulaireMajEdition`, `ContenuEditableAdmin`, `EditeurInlineCMS`** : 4 sites d'usage légèrement différents (props, styling). La factorisation aurait coûté plus que le bénéfice (cf. CLAUDE.md « Three similar lines is better than a premature abstraction »). À reconsidérer si on dépasse 6-7 sites.
- **Email envoyé même si Brevo est en mode mock** : aucun risque, ça loggue. Permet de tester le routage de bout en bout sans avoir branché Brevo en prod.
- **Échec silencieux de l'envoi email** : la cloche est posée d'abord. Si l'email échoue (Brevo down, email invalide, quota dépassé), la cloche reste — la personne sera notifiée in-app au minimum.

## Tests

- **993 tests verts** (991 → 993, +2 intégration md→html→sanitize en V2.5.36).
- **Typecheck** vert.
- **Lint biome** propre.
- **HTTP 200** vérifié sur `/s-informer/journal`, `/comprendre/doctrine`, `/agir/adherer`, `/connexion`.

## Cas d'usage immédiats (vérifiables au navigateur)

1. **Convertisseur** : aller sur `/comprendre/doctrine` connecté en admin → cliquer « Modifier » → mode Markdown → écrire `## Titre\n\n**gras** et *ita*` → basculer sur « Riche » → le contenu apparaît déjà mis en forme dans l'éditeur (au lieu d'une page vide).
2. **Journal rich text** : `/s-informer/journal/{slug}` connecté admin → formulaire d'édition → bouton « Riche » → écrire un article avec couleurs/images/YouTube → enregistrer → revoir en visiteur, le rendu riche s'affiche.
3. **Décider rich text** : `/s-informer/decider/{slug}/{reunionId}` connecté admin → bouton « Riche » sur le PV → rédiger un compte-rendu structuré avec citations et liens → enregistrer.
4. **Prefs réseau** : `/profil/notifications` → section « Notifications du réseau social » → choisir « Cloche + email immédiat » pour les messages directs → enregistrer. À la prochaine DM reçue, recevoir un email (Brevo mock = log console en dev).
5. **Pref `aucune`** : choisir « Silence total » pour les soutiens → la cloche n'apparaîtra plus à chaque cœur posé.

## Notes pour les chantiers suivants

- Les 4 nouvelles migrations (`20260530500000`, `20260530600000`, `20260530700000` + les antérieures du cycle V2.5.23-V2.5.27) doivent être appliquées au distant via `supabase db push` quand la Phase M sera ouverte.
- Le cron de digest est le prochain gros morceau pour activer pleinement les modes `digest_*`.
- La rich-text infrastructure est en place pour étendre à n'importe quelle table avec un champ texte long. Pattern : `colonne text` nullable + Server Action sanitize + UI switch + rendu prioritaire HTML.
