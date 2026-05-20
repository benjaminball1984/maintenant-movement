# Plan de chantiers — Site Maintenant!

**Méthode** : un chantier à la fois, branche dédiée, validation à chaque fin de chantier, ADR (Architecture Decision Record) en cas de choix technique notable.

---

## Phase 0 — Fondations

**0.1 Initialisation dépôt** : Next.js 14 + TypeScript + Tailwind + Biome + structure dossiers conforme `02_STACK.md §4` + pipeline CI + déploiement Cloudflare Pages.
**0.2 Système de design** : tokens CSS depuis `04_DESIGN-TOKENS.md` + polices (Fraunces + Atkinson + JetBrains Mono) + composants UI bas niveau + page `/design-system`.

## Phase 1 — Modèle de données et auth

**1.1 Schéma BDD initial** : `personne`, `commune`, `appartenance_commune`, `federation`, `gt_thematique`, `confederation`, `droit_admin`, `journal_admin`. RLS minimale + types TypeScript.
**1.2 Auth 4 portes** : email+mdp, magic link, OAuth GAFAM, OAuth éthique. Turnstile + validation email + Brevo.
**1.3 Profil utilisateurice** : dashboard + 7 onglets. Visibilité par champ. Export ZIP. Suppression différée 30 j. 2FA.

## Phase 2 — Accueil + Comprendre + pages statiques

**2.1 Page d'accueil** : header + bloc titre + 4 unes empilées + pré-footer compteurs + footer + modale signature.
**2.2 Section Comprendre + pages utilitaires** : `/comprendre/*`, `/a-propos`, `/mentions-legales`, `/confidentialite`, `/contact`, 404.

## Phase 3 — Mobiliser

**3.1 Pétitions** : modération a priori + compteur stretch ×1,5 à 90 % + signature anonyme/connectée + tags newsletter.
**3.2 Mobilisations + Campagnes** : modération adaptée + carte unifiée + clic « je participe ».
**3.3 Cagnottes** : 3 types (ouvertes, lutte, cotisations) + Stripe Checkout + Stripe Connect KYC + don T99CP + frais 5%€/0%T99CP.

## Phase 4 — S'entraider

**4.1 Hébergement + Transport + Qui prête tout + Fruits de la terre** : modèle « offre » + géoloc + messagerie + frigos solidaires (étiquetage, registre).
**4.2 SEL** : services particulier·ères + volontariats collectifs + modération auto 2h + crédit 99-coins + RBU 30/mois via wallet certifié.
**4.3 Marché solidaire** : 3 onglets (Produit, Boutique, Minimarché) + toggle vente/don + 5 étoiles unilatéral + 4 monnaies en physique.

## Phase 5 — Agir

**5.1 Adhérer (3 chemins)** : gratuit, 12 €, 12 T99CP + mail de relance J+365.
**5.2 Communes libres + Fédérations + Confédérations** : import CSV 2100-2300 communes + permissions (1 clic, modales 2e/3e, refus 4e) + nature libre des fédérations + Assemblée Confédérale (binômes tirés au sort + incompatibilité cumul).
**5.3 Moments solidaires** : 8 types + génération auto 7 RDV pour porte-à-porte + tracker Tupperwares + flyer auto sans inclusivité.
**5.4 D'autres moyens d'agir** : page sobre + admin liste + mention distance protectrice.

## Phase 6 — Transverses

**6.1 Carte unifiée** : MapLibre GL JS + agrégation bases séparées + filtres (type, espace, date, département) + clusters.
**6.2 Agenda agrégé** : miroir temporel + navigation localité/département/date.

## Phase 7 — S'informer

**7.1 Média Maintenant** : Éditos, Tribunes, Articles, Brèves Reuters+AP, Dessins, Podcasts, Vidéos, Lives, Newsletter taggée 3 axes.
**7.2 Maintenant Radio** : player live AzuraCast.
**7.3 Maintenant Médias (journal-affiche)** : 30 modèles Canva + agent Claude API + Paged.js + Puppeteer + plafond 100 affiches.
**7.4 Sondages** : création + photo + 2 modes (classique, pondéré méthode quotas ≥ 300 répondant·es).
**7.5 Réseau social** : flux + algo strict transparent (soi → ami·es → site → entraide 5%) + messagerie + modération a posteriori + encart financement permanent.
**7.6 Décider** : LiveKit self-hosted + salles permanentes/temporaires + bot Décider tokens + 3 modes (consensus, levée d'objections, jugement majoritaire) + privacy par périmètre + enregistrement selon type + PV automatiques.

## Phase 8 — Notifications

**8.1 5 canaux hiérarchisés** : messagerie interne (primaire) + cloche + push opt-in + mail récap mardi (style Facebook) + newsletter vendredi (Brevo). Préférences par canal et type.

## Phase 9 — Admin et modération

**9.1 Console modération unique** : 7 onglets + droits par personne + audit log.
**9.2 Tableau de bord admin** : stats globales et par commune + gestion financière + édition pages éditoriales et catégories marché.

## Phase 10 — Migration Base44

**10.1 Script de migration** : import 946 membres + 9k newsletter + 16k signataires + préservation consentements + réécriture pétitions + reprise 2 articles.

## Phase 11 — Polish et mise en ligne

**11.1 Accessibilité et performance** : WCAG 2.1 AA + Lighthouse perf ≥ 90 mobile + E2E Playwright.
**11.2 Sécurité** : CSP stricte + test RLS + pentest interne + backup BDD + plan incident.
**11.3 Lancement** : déploiement prod + DNS + monitoring + astreinte.

---

## Récapitulatif des phases

| Phase | Chantiers | Estimé Claude Code |
|---|---|---|
| 0 — Fondations | 2 | 2-3 sessions |
| 1 — Modèle + Auth | 3 | ~6 sessions |
| 2 — Accueil + statiques | 2 | 2-3 sessions |
| 3 — Mobiliser | 3 | ~7 sessions |
| 4 — S'entraider | 3 | ~7 sessions |
| 5 — Agir | 4 | ~6,5 sessions |
| 6 — Transverses | 2 | ~3 sessions |
| 7 — S'informer | 6 | ~17-19 sessions |
| 8 — Notifications | 1 | ~2 sessions |
| 9 — Admin | 2 | ~4 sessions |
| 10 — Migration Base44 | 1 | ~2 sessions |
| 11 — Polish + lancement | 3 | ~5 sessions |

**Total** : ~60-70 sessions Claude Code, ~3 à 6 mois selon le rythme. Coût API estimé 80-200 €.

---

## Conventions

**Branches** : `main` (prod), `develop` (préprod), `feature/phase-N-chantier-N.X-description`, `hotfix/...`.

**Commits** : `phase N - chantier N.X - description courte`.

**Critère de fin de chantier** : tests verts + doc à jour + ADR si décision + review Lilou/Ben.

**ADR** : chaque décision technique notable est documentée dans `docs/ARCHITECTURE-decisions.md` au format Contexte / Décision / Conséquences / Alternatives considérées.
