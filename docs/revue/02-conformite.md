# Revue 2026 — Bloc 2 : Audit de conformité code ↔ CDC

> Confrontation des **60 points** de la checklist (`01-synthese-cdc.md` §14) au code réel. 4 sous-agents ont audité 4 domaines en parallèle, avec preuve (fichier:ligne). Verdicts : ✅ conforme · ⚠️ écart partiel · ❌ non conforme · ❓ à confirmer/introuvable.

## Tableau de bord

- **Conformes (✅)** : ~33 points. La **doctrine de greffe est exemplaire** (0 DROP, compteurs en vues, scripts `--dry-run`, RLS par migration, colonnes V1 conservées). Vocabulaire propre (Maintenant Médias, 99-coin, termes interdits absents). Parité 99-coin 1:1 **résolue** (le « piège 0,10 € » de la mémoire n'existe plus). Tokens/design/mock/Server Components conformes.
- **Écarts (⚠️/❌)** : ~20 points, dont 1 critique sécurité (2FA), 1 systémique écriture (tiret cadratin), 2 RGPD (anonymisation, export ZIP).
- **Reportés (architecture, hors bug)** : tronc `Objet`/`Espace`, `Rattachement` générique, `type_lien`, `OutilActivé`, ESM+5, statuts §13 (décision Lilou/Ben requise).

---

## A. Données, doctrine de greffe, RGPD

| # | Point | Verdict | Preuve | Note |
|---|---|---|---|---|
| 1 | Aucun DROP données réelles | ✅ | 0 `drop table/column` dans migrations | greffe exemplaire |
| 2 | Aucun reset compteur | ✅ | compteurs = VUES (`013:116`, `019:146`) / fonction (`037`) | reset impossible |
| 3 | Scripts data `--dry-run`+idempotent | ✅ | `lireMode()` + upserts (import-communes, migrer-base44, backfill-*) | RAS |
| 5 | RLS par migration | ✅ | RLS inline dans chaque migration table V2 ; `consentement.sql:144` | aucune RLS déportée |
| 6 | `consentement` granulaire + colonnes V1 gardées | ✅ | `20260527010000_consentement.sql` ; booléens V1 conservés `013:29-30` | RAS |
| 7 | `droit` atomique + `droit_admin` gardé | ✅ | `20260527020000_droit.sql` ; presets `lib/droit-presets.ts` | coexistence V1/V2 |
| 8 | Signature compte avant email + snapshot | ⚠️ | comportement OK (vue compte tout) mais **pas de colonnes `compte_immediatement`/`snapshot` nommées** | additif possible |
| 9 | Don payeur non nullable + `afficher_nom` | ⚠️ | `transaction_entrante.payeur_personne_id` **nullable** ; **`afficher_nom` absent** (0 occ.) | greffer afficher_nom |
| 10 | Hash T99CP unique | ✅ | `t99cp_hash_consomme.tx_hash PK` + index unique `don` | double garde-fou |
| 11 | Caisse par type + par cagnotte + réceptacle daté | ✅ | `20260527050000_caisse.sql` | conforme D7 |
| 12 | Reversement justificatif obligatoire | ✅ | `caisse.sql:177` `justificatif... not null check` | rigueur SQL |
| 13 | `journal_admin` append-only + alimenté | ⚠️ | table immuable ✅ mais **modération pétition/export/suppression n'y écrivent pas** | brancher le helper journal |
| 14 | M+7 / ORM+5 / ESM+5 sans collision | ⚠️ | M+7 parfait (`profil_unifie`) ; **ORM+5 absent** (slug+uuid) ; ESM+5 attend le tronc | greffer numero_organisation |
| 49 | RLS PII + admin hors webhooks | ✅ | RLS partout ; `admin.ts` jamais côté client | confiné serveur |
| 50 | Suppression différée 30j + anonymisation | ⚠️ | statut/colonnes/RLS présents ; **AUCUN job n'anonymise après 30j** | créer `appliquer_suppressions_differees()` + cron |
| 51 | Export ZIP RGPD (6 entrées) | ⚠️ | **STUB** : `profil/actions.ts:214` n'envoie qu'un mail, aucun ZIP | implémenter génération réelle |
| 52 | Email vérifié bloque + ≥15 ans + Turnstile | ✅/❓ | ≥15 ✅ (`personne.sql:60`), Turnstile ✅ (vérif serveur) ; gate email à confirmer sur creerPetition/adherer | vérifier gate |
| 53 | Visibilité champ + email caché modé + votes anonymes | ⚠️ | visibilité ✅ ; email visible aux modé pétitions ; **votes Décider : pas de table bulletin** | concevoir bulletin anonyme |
| 54 | Pas de bandeau cookies/traceur | ✅ | 0 GA/fbq/matomo ; cookies techniques seuls | RGPD minimale OK |

## B. Droits, sécurité, paiement, 99-coin

| # | Point | Verdict | Preuve | Note |
|---|---|---|---|---|
| 15 | Aucun droit politique dans `droit` | ✅ | `droit.sql:58-91` 24 type_droit plateforme | conforme MD0 |
| 16 | Contrôle sur (cible_type, cible_id) | ✅ | `lib/droit.ts:203` `verifierDroit` | conforme MD2 |
| 17 | Non-élévation + verrou gerer_droits | ⚠️ | `lib/droit.ts:243 peutAccorder` existe mais **non câblé** (UI prod = `droit_admin` + `estAdminNational`) | brancher quand `droit` V2 = source |
| 18 | Aucune récursion de droits | ✅ | SELECT plats only | conforme MD6 |
| 19 | Admin total : 2FA+journal+double validation | ⚠️ | journal OK ; **2FA non enforcée** ; **double-validation absente** (`transaction-sortante.ts:97`) | voir #21 + garde init≠confirm |
| 20 | Preset créateur (objet sans gerer_droits) | ✅ | `droit-presets.ts:45` | conforme MD4 |
| 21 | 2FA obligatoire moderation/admin/tresorerie | ❌ | `middleware.ts`/`garantirAccesAdmin` ne checkent jamais `aal2` ; TOTP optionnel | **gap sécurité** : check `getAuthenticatorAssuranceLevel()` |
| 22 | Aucun wallet intégré | ✅ (1 résidu) | `/profil/wallet` retiré ; **résidu** `adherer/actions.ts:168` appelle `envoyerTransaction` | migrer adhésion T99CP vers redirection |
| 23 | Redirection 99-coin home only + nouvelle fenêtre | ⚠️ | doctrine respectée ; **aucun bouton `the99coinproject.org` réel** dans l'UI | ajouter le CTA target=_blank |
| 24 | Solde privé + adresse 0x jamais exposée | ✅ | aucun solde affiché ; adresse cagnotte = destinataire assumé | conforme §19 |
| 25 | 99-coin toujours proposé + exceptions | ⚠️ | proposé partout ; **frais de port POL marché non implémenté** | feature absente |
| 26 | Régimes A/B respectés | ✅ | `lib/caisse-flux.ts` (B) ; SEL/marché direct (A) | conforme §2 |
| 27 | Frais 5%/0% + double affichage + parité | ✅ | `frais.ts:13` 0.05 / 0n ; `conversion-99coin.ts:15` = 100 (1:1) ; 0 occ `0,10` | **piège résolu** |

## C. UI transversale, Open Graph, design, technique

| # | Point | Verdict | Preuve | Note |
|---|---|---|---|---|
| 28 | ET1 image par défaut par type | ✅ | `lib/images.ts:51` + `images-defaut.ts` (vraies photos V2.6.27) | RAS |
| 29 | ET2 upload partout, jamais URL | ⚠️ | composant unique OK ; **3 champs `type=url` résiduels** : logo orga (création+gestion), `photo_url` profil | migrer vers `ChampImageObjet` |
| 30 | ET3 bascule thème nav + mode_theme | ✅ | `Header.tsx:75` ThemeToggle → `theme.ts:71` mode_theme | RAS |
| 31 | ET4 Button primary = grad+shadow | ✅ | `Button.tsx:31` bg-grad shadow-brand ; tokens intacts | RAS |
| 32 | OG côté serveur + images sur fiches | ⚠️ | helper serveur sur **18 fiches** ; **manquent images sur 3** : article journal, profil réseau, commune référentiel | 3 appels `metadataPourPartage` |
| 33 | 3 voies de partage sur les fiches | ⚠️ | `BoutonsPartage` sur **3 fiches /18** ; **3e voie "publier sur réseau" absente** | généraliser + ajouter post-réseau |
| 55 | Tokens couleur/typo + lucide | ✅ | tokens exacts ; pas de 11 hues ; Sora/Inter/JetBrains ; hex en dur = MapLibre + palette rich-text (exceptions légitimes) | RAS |
| 56 | 44px + focus + reduced-motion + pas autoplay | ✅ | `Button h-11/12` ; `globals.css:104,113` ; pas d'autoplay forcé ; pas de carousel | RAS |
| 57 | Server Components + Actions+Zod + 3 clients | ✅ | aucun `page.tsx` 'use client' ; service_role hors client | API = health/geojson (lecture) |
| 58 | Adapter mock par défaut | ✅ | 6 factories `?? 'mock'` | démarre sans clé |

## D. Principes structurels, vocabulaire, écriture, modération

| # | Point | Verdict | Preuve | Note |
|---|---|---|---|---|
| 34 | Double consentement rattachement | ⚠️ | amitié/revendication ✅ ; **pas de `Rattachement` générique D3** (cible reportée) | attendu |
| 35 | Fork non destructif | ⚠️ | gestionnaire/appartenance soft-retire ✅ ; **`contenu_organisation` DELETE dur** | soft-delete possible |
| 36 | type_lien liste fermée | ❓ | aucun `type_lien` (cible reportée) | non bloquant |
| 37 | Outils activables = ligne (pas migration) | ⚠️ | `groupe_entraide_local` = colonnes booléennes (liste fermée ✅, nouvel outil = migration) | écart V1→V2 acceptable |
| 38 | FilDeGroupe distinct du DM | ✅ | `components/fil-groupe/` + `fil_groupe.sql` | composant transversal |
| 39 | Message d'amorce personnalisable | ✅ | `lib/reservation-amorce.ts:76` | testé |
| 40 | Pas de suggestion par géo | ✅ | recherches volontaires only | conforme §16 |
| 41 | Compteur public = membres actifs §13 | ⚠️ | compte `statut='actif'` (= cycle de vie, **pas** l'engagement §13) ; **triple statut §13 non implémenté** | décision produit |
| 42 | Mini-blog créateur + mandataires | ⚠️ | **tout membre actif** peut publier au nom de l'espace (plus large que CDC §7) | arbitrer |
| 43 | Mandat orga obligatoire + tracé | ✅ | `validation.ts:66` attestation Zod ; **trou** : `declarerOrganisationInitiatriceAction` contourne le schéma | aligner |
| 59 | Modération a priori/a posteriori + aucune IA | ✅ | pétition/campagne en_moderation ; autres immédiat ; 13 consoles ; 0 IA | conforme §8 |
| 60 | Max 2 mails/sem + push opt-in | ✅ | `CanalNotification` mardi+vendredi ; push off par défaut | structure OK |
| 44 | « Maintenant Médias » (S) | ✅ | 0 « Maintenant Média » fautif | conforme |
| 45 | « 99-coin » tiret | ✅ | 0 « 99coin »/« 99 coin » en texte | conforme |
| 46 | Termes interdits absents | ✅ | président/marketplace/horizontalité/non-violence/travail-SEL : 0 hors fichiers d'interdiction | conforme |
| 47 | Tiret cadratin (—) | ⚠️ | **303 occ. en code** (app 176, components 57, lib 70) + ~600 docs ; dont **texte affiché** (~40 `<title>`/OG, JSX, placeholders) | **violation systémique §10** |
| 48 | Inclusivité + pas de jargon | ✅ | inclusivité large ; jargon pédant absent | conforme |

---

## Liste priorisée des correctifs

### P0 — Critique (sécurité / RGPD / règle d'écriture systémique)
- **C1. Imposer la 2FA** (point 21) sur les gardes admin/modération/trésorerie : check `getAuthenticatorAssuranceLevel()` → redirection `/profil/securite/2fa` si pas `aal2`. *(local, faisable)*
- **C2. Tiret cadratin dans les textes AFFICHÉS** (point 47) : remplacer `—` par deux-points/parenthèses/virgules dans les `<title>`/metadata, JSX visibles, placeholders (priorité au rendu usager), puis commentaires et docs. *(local, mécanique)*
- **C3. Job d'anonymisation 30 j** (point 50) : fonction SQL `appliquer_suppressions_differees()` (nullifie, garde FK, journalise) + cron. *(migration + cron : la fonction est locale ; le cron est Phase finale)*
- **C4. Export ZIP RGPD réel** (point 51) : générer les 6 entrées (route serveur + JSZip + Storage + URL signée). *(local, infra async)*

### P1 — Important (conformité fonctionnelle)
- **C5. `afficher_nom` + payeur non nullable** (point 9) sur transaction_entrante/don. *(migration additive)*
- **C6. Alimenter `journal_admin`** sur modération pétition, export, suppression (point 13). *(local)*
- **C7. Double-validation reversement** (point 19) : refuser confirme si `initie_par == confirmateur`. *(local, 3 lignes)*
- **C8. OG images sur 3 fiches** (point 32) : article journal, profil réseau, commune référentiel. *(local)*
- **C9. ET2 : migrer 3 champs `type=url`** (point 29) vers `ChampImageObjet` (logo orga ×2, photo_url profil). *(local)*
- **C10. Généraliser `BoutonsPartage`** aux ~15 fiches restantes + 3e voie « publier sur le réseau » (point 33). *(local)*
- **C11. CTA redirection 99-coin** `the99coinproject.org` (nouvelle fenêtre) dans les formulaires T99CP (point 23). *(local)*

### P2 — Polish
- **C12. Flèches `→`/`←`** dans textes publiés → reformuler (points 47/spec écriture). *(local)*
- **C13. ORM+5** : `numero_organisation` (`^ORM[A-Z0-9]{5}$`) + trigger calqué sur M+7 (point 14). *(migration additive)*
- **C14. Colonnes `compte_immediatement` + `snapshot`** sur signature_petition (point 8, additif). *(migration additive)*
- **C15. `contenu_organisation` en soft-delete** (point 35, cohérence fork). *(local)*
- **C16. Aligner `declarerOrganisationInitiatriceAction`** sur l'attestation obligatoire (point 43). *(local)*
- **C17. Résidu `envoyerTransaction`** dans adhésion T99CP → pattern redirection (point 22). *(local)*

### P3 — Décision Lilou/Ben requise (architecture / produit, reporté)
- **D1. Statuts §13** (silencieux / membre non actif / membre actif-voteur) + correction du compteur public (point 41). *(décision produit)*
- **D2. Anonymat des votes Décider** : table `bulletin_decider` sans `personne_id` + token purgé (point 53). *(refonte Décider, MVP actuel)*
- **D3. Tronc `Objet`/`Espace`, `Rattachement` générique, `type_lien`, `OutilActivé`, ESM+5** (points 34/36/37) : Vague 5 explicitement reportée. *(décision nominative)*
- **D4. Mini-blog : resserrer aux mandataires** ou acter l'ouverture à tout membre actif (point 42). *(décision produit)*
- **D5. Frais de port marché en POL** (point 25) : feature absente, à spécifier. *(spec)*

---

*Fin du Bloc 2. Les correctifs P0/P1/P2 marqués « local » sont applicables au Bloc 6. Les P3 attendent un arbitrage. Blocs 3-5 (responsivité/UX, accessibilité, performance) suivent.*
