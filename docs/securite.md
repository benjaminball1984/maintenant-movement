# Audit sécurité — Maintenant!

Chantier 11.2. Inventaire des mesures de sécurité posées par le code applicatif et liste des actions opérationnelles complémentaires.

---

## 1. Sécurité des données

### 1.1 Row Level Security (RLS)

**Toutes les tables** ont `enable row level security` activé. Au moins une `select` policy est posée par table. Le détail par table :

| Table | RLS | Lecture | Insert | Update |
|---|---|---|---|---|
| personne | ON | propriétaire + admin | self | self |
| commune | ON | public | admin/auteur | auteur |
| appartenance_commune | ON | self + admin | self | self |
| federation | ON | public | auth | admin |
| confederation | ON | public | auth | admin |
| gt_thematique | ON | public | auth | admin |
| droit_admin | ON | self + admin | admin national | admin national |
| journal_admin | ON | admin | admin | - |
| petition | ON | publié + auteur + modé | auth | auteur si en_moderation, modé sinon |
| signature_petition | ON | public (compteur) + admin | tout | - |
| mobilisation | ON | publié + auteur + modé | auth | auteur si publiée, modé sinon |
| participation_mobilisation | ON | propriétaire + admin | tout | - |
| campagne | ON | publié + auteur + modé | auth | auteur si en_moderation, modé sinon |
| module_campagne | ON | identique à campagne parente | identique | identique |
| cagnotte | ON | publié + suspendu si modé + auteur | auth + cotisations admin nat | porteur + modé |
| don | ON | propriétaire + admin | tout | - |
| offre_entraide | ON | publié/cloturé public + créateur retiré | auth | créateur + modé |
| service_sel | ON | identique offre_entraide | auth | créateur + modé |
| prestation_sel | ON | parties prenantes + admin | parties prenantes | parties prenantes |
| produit_marche | ON | publié sauf retiré + vendeur + modé | auth | vendeur + modé |
| boutique_marche | ON | identique | auth | créateur + modé |
| produit_boutique | ON | public | vendeur OU créateur boutique | identique + modé |
| minimarche_solidaire | ON | identique | auth | créateur + modé |
| notation_marche | ON | public | auteur sur produit vendu | auteur + modé |
| adhesion | ON | self + admin nat | self | admin |
| mandat_confederal | ON | public (transparence) | admin nat | admin nat |
| moment_solidaire | ON | publié + créateur + modé | auth + commune membre | créateur + modé |
| participation_moment | ON | organisateurice + admin | tout | - |
| tupperware | ON | organisateurice + admin | organisateurice + admin | organisateurice + admin |
| organisation_partenaire | ON | affichée public + admin | admin/modé | admin/modé |
| media | ON | publié + auteur + modé | auth (auteurice = self) | auteur si brouillon + modé |
| sondage | ON | ouvert/fermé/archivé public + créateur retiré + modé | auth | créateur si ouvert + modé |
| reponse_sondage | ON | self + admin | self | - |
| notification | ON | destinataire + admin | tout | destinataire |
| preference_notification | ON | self + admin | self | self |

### 1.2 Garde-fous CHECK BDD

Les contraintes CHECK enforcent les règles métier au niveau BDD (impossible à contourner même par SQL direct) :

- `service_sel.categorie` : `service | volontariat` (jamais « travail », cf. doctrine §6E).
- `produit_marche.mode + prix` : don → prix à 0 ; vente → au moins un prix > 0.
- `minimarche_solidaire.monnaies_acceptees` : sous-ensemble strict de {T99CP, EUR, G1, MNLC}.
- `notation_marche.acheteureuse_id <> vendeureuse_id` : pas d'auto-notation.
- `notation_marche` UNIQUE (produit, acheteureuse) : pas de notation multiple.
- `adhesion.chemin + montant` : gratuit → 0, euros → > 0, t99cp → > '0'.
- `mandat_confederal` trigger d'incompatibilité de cumul (lib le mandat inférieur).
- `appartenance_commune` trigger max 3 actives + trigger anti-spam 1 transition / 30 jours.

### 1.3 Validations applicatives

Toutes les Server Actions :
1. Valident l'entrée avec un schéma Zod strict.
2. Vérifient le token Turnstile (sauf actions internes admin).
3. Vérifient la session via `getSession` ou `getSessionOuRediriger`.
4. Vérifient les permissions via les helpers SQL `est_admin_*` / `est_membre_commune` / `est_moderateurice`.

### 1.4 Anonymisation

`personne.statut = 'anonymise'` après suppression différée 30 jours (chantier 1.3). Les contributions restent (préservation de la trace politique), l'identité disparaît.

---

## 2. Sécurité applicative

### 2.1 Anti-bot (Cloudflare Turnstile)

Tous les formulaires publics passent par `<CaptchaTurnstile>`. Le token est validé côté serveur par `getTurnstileService().verifier(token)`. En mock par défaut.

### 2.2 Authentification

4 portes (chantier 1.2) : email/mot de passe, magic link, OAuth GAFAM (Google/Apple/Microsoft), OAuth éthique (Mastodon/Framasoft/Solid). Email vérifié systématique. 2FA optionnelle pour toustes, **obligatoire pour les comptes d'admin** (animation, modération, trésorerie).

### 2.3 CSP (Content Security Policy)

Headers définis dans `next.config.mjs > headers()` (posés au chantier 12.6, polish post-revue). Directives :

- `default-src 'self'` (tout par défaut limité à l'origine).
- `script-src` : `'self'`, `'unsafe-inline'` (Next.js injecte des scripts inline pour l'hydratation), `challenges.cloudflare.com` (Turnstile), `js.stripe.com` (Stripe.js).
- `style-src` : `'self'`, `'unsafe-inline'` (Tailwind injecte des styles critiques inline).
- `img-src` : `'self'`, `data:`, `blob:`, `*.tile.openstreetmap.org` (MapLibre tuiles), `*.supabase.co` (médias).
- `connect-src` : `'self'`, `*.supabase.co` + `wss://*.supabase.co`, `*.livekit.cloud` + WSS, `api.stripe.com`, `challenges.cloudflare.com`.
- `frame-src` : Turnstile + Stripe (paiement et hooks).
- `font-src` : `'self'`, `data:`.
- `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'` (anti-clickjacking).

Headers HTTP complémentaires posés en même temps :

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(self), geolocation=(self), payment=(self)`

À tester en preview Cloudflare Pages : si une ressource est bloquée, ajuster la directive concernée (DevTools → Console → erreurs CSP).

### 2.4 Pas de fuite de clés

Les variables `NEXT_PUBLIC_*` sont les seules exposées côté client. `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `BREVO_API_KEY`, etc. ne sortent jamais du serveur.

### 2.5 Mocks par défaut

Tous les services externes (Stripe, T99CP, Brevo, LiveKit, Turnstile) ont une implémentation mock par défaut. En dev, on ne peut pas accidentellement écraser des données prod.

---

## 3. Sécurité opérationnelle (à compléter par Lilou/Ben au lancement)

### 3.1 Backups

- Supabase : dump quotidien `supabase db dump > backup-AAAA-MM-JJ.sql`.
- Rétention : 30 jours minimum.
- Test de restauration : à programmer tous les trimestres.

### 3.2 Pentest

À programmer avec un cabinet spécialisé ou un·e bénévole sécu de confiance. Périmètre minimum :
- Énumération des endpoints publics.
- Tentatives d'injection SQL (la RLS doit tout bloquer mais il faut le vérifier).
- Tentatives de bypass auth (cookies, headers).
- Test CSP en environnement isolé.

### 3.3 Plan incident

Document séparé `docs/plan-incident.md` à rédiger par Lilou/Ben + la trésorerie + le·la DPD :
- Détection : alertes Sentry + logs Supabase + signalements usager·ères.
- Notification : qui notifie qui ? (DPD pour les fuites de données, trésorerie pour les fraudes paiement).
- Communication : modèle de mail aux usager·ères concerné·es.
- Restauration : procédure de rollback depuis le dernier backup.

### 3.4 RGPD

- Politique de confidentialité à jour avant lancement (cf. `docs/specs/05_RGPD.md`).
- DPD bénévole à désigner.
- Adresse + RNA + email contact + email DPD à renseigner.
- Notification migration Base44 : pas requise (cf. doctrine §13 « MAJ de la politique de confidentialité suffit »).
- Suppression différée 30 jours + export ZIP (chantier 1.3).
- Anonymisation des contributions (chantier 1.3).

---

## Tableau récap

| Mesure | Implémentée | Vérifiée |
|---|---|---|
| RLS sur toutes les tables | ✓ | À tester par script avant prod |
| CHECK BDD sur règles métier sensibles | ✓ | Tests unitaires couvrent les schémas Zod |
| Validations Zod systématiques | ✓ | 245 tests verts |
| Turnstile sur tous les formulaires publics | ✓ | Mock dev, à brancher prod |
| Auth 4 portes + email vérifié + 2FA admin | ✓ | Chantier 1.2 |
| CSP stricte | Posée (12.6) | À tester en preview Cloudflare |
| Mocks par défaut | ✓ | - |
| Backups quotidiens | ✗ | À programmer côté Supabase |
| Pentest | ✗ | À programmer post-lancement |
| Plan incident écrit | ✗ | À rédiger par Lilou/Ben |
