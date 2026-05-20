# Manifest : Phase 10, Chantier 10.1 — Migration Base44

**Date de fin** : 2026-05-21
**Branche** : `feature/phase-10-chantier-10.1-migration-base44`
**Commit final** : `À RENSEIGNER PAR LE COMMIT FIX SUIVANT`
**Durée approximative** : 1 session Claude Code

---

## Livré et fonctionnel

- [x] **Script `scripts/migrer-base44.ts`** : CLI Node/TSX qui lit 4 CSV (membres, newsletter, petitions, signatures) depuis un dossier d'export Base44 et :
  - imprime un rapport de ce qui serait importé pour les **membres** (946 attendus) : nom, prénom, email, code postal, date d'adhésion ;
  - liste les **abonné·es newsletter** (~9000 attendus) à pousser dans Brevo avec le tag `origine: base44-newsletter` ;
  - upsert les **pétitions** dans la table `petition` au statut `archivee` (à réécrire avant repub, cf. spec §13) ;
  - liste les **signataires** (~16000 attendus) à associer aux pétitions via email.
- [x] **Idempotent** : le script peut être rejoué (upsert sur slug pour les pétitions, l'import des autres entités passe par l'Admin API séparément).
- [x] **RGPD** : pas de notification individuelle aux ~10 000 personnes (cf. doctrine §13 « MAJ de la politique de confidentialité suffit »).
- [x] **Lint Biome + typecheck tsc + build Next.js** : tous verts.

## Livré partiellement

- [ ] **Création des comptes auth.users via Admin API** : le mapping `email → auth.users.id` doit passer par `supabase.auth.admin.createUser()` (ou `inviteUserByEmail()`). Le script v1 prépare les données mais n'insère pas les utilisateur·ices Supabase parce que c'est un appel séparé qui doit envoyer un mail de magic link à chacun. À faire au moment du lancement avec la décision de Lilou/Ben sur le wording du mail.

## Non livré (et pourquoi)

- [ ] **Reprise des 2 articles** : ils doivent être réécrits côté édito (la spec §13 mentionne « 2 articles à reprendre »). Le moteur Maintenant Médias est posé (chantier 7.1), il suffira d'insérer 2 lignes `media` au moment voulu.
- [ ] **Fusion email → auth.users.id quand la personne se connecte** : nécessite un trigger ou un hook qui, au premier login, retrouve la ligne `personne_pending` (table à créer si besoin) et la merge avec `auth.users.id`. Pour 10.1 v1, on documente la procédure plutôt que de la coder : au lancement, on crée les `auth.users` via Admin API, ce qui génère les `personne` correspondants par déclenchement Supabase.

## Décisions techniques prises

- **Pas de table `personne_pending`** : on évite l'invention d'une table temporaire. Le script v1 produit un rapport et la création effective se fait via `supabase.auth.admin.createUser({ email, email_confirm: true })` qui poste un magic link. Ce script peut être un wrapper supplémentaire.
- **Pétitions importées au statut `archivee`** : la spec §13 mentionne « plusieurs pétitions à réécrire ». On préserve les anciennes en archive pour audit, la rédaction réécrit, on republie sous nouveaux slugs.
- **Signataires anonymisés liés par email** : pour préserver les compteurs historiques, on conserve email + code postal + date de signature. Si la personne se crée un compte plus tard, on pourra la rattacher via son email.
- **Newsletter via Brevo tag** : pas d'insertion en BDD locale (les emails newsletter restent dans Brevo). Le tag `origine: base44-newsletter` permet le ciblage segmenté.

## Tests

- Pas de tests unitaires (script CLI, side-effects sur Supabase). Le rapport imprimé sert de garde-fou : on inspecte les comptages avant de tirer le déclencheur Admin API.
- Lint, typecheck, build : tous verts (245 tests).

## Notes pour les chantiers suivants

- **Chantier 11.3 (Lancement)** : enchaîner :
  1. Export CSV Base44 → `data/base44/{membres,newsletter,petitions,signatures}.csv`.
  2. Lancer `npx tsx scripts/migrer-base44.ts data/base44/` en dry-run pour vérifier le rapport.
  3. Lancer un script complémentaire qui appelle `supabase.auth.admin.createUser` pour chacun·e des 946 membres + envoi du mail de bienvenue.
  4. Pousser les 9000 emails newsletter dans Brevo avec le tag `origine: base44-newsletter`.
  5. Insérer manuellement les 2 articles réécrits dans `media` via la console admin (chantier 9.1).
- **Politique de confidentialité** : MAJ au moment du lancement avec mention explicite « les inscriptions Base44 sont conservées sans nouvelle notification, conformément à la doctrine RGPD §13 ».
