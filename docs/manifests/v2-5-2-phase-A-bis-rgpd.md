# Manifest — Chantier V2.5.2 : Master Plan V2.6 Phase A-bis (profil + RGPD)

**Date de fin** : 2026-05-29 (nuit du 29 au 30)
**Branche** : `main`
**Commit final** : (à renseigner après commit)
**Durée approximative** : ~10 min (chantier court car espace profil déjà existant).

## Constat préalable

L'espace profil et les pages légales (mentions, confidentialité) existaient DÉJÀ avant ce chantier (28 fichiers dans `app/(membre)/profil/`, 2 pages éditables CMS dans `app/(public)/`). La Phase A-bis du Master Plan était donc presque entièrement faite. Le seul vrai blocage qui restait était l'intégration du **cadre juridique** précis (Master Plan V2.6 §4.3) : « Collectif Maintenant » comme responsable de traitement, trois entités distinctes (association/plateforme/mouvement), statut actuel d'association de fait.

## Livré et fonctionnel

- [x] **`app/(public)/mentions-legales/page.tsx`** : fallback réécrit pour intégrer le cadre juridique complet. Sections : éditeur (Collectif Maintenant + état actuel d'association de fait), représentant mandaté (Ben), directeur·rice publication (placeholder), hébergement (Cloudflare + Supabase), propriété intellectuelle, données personnelles (renvoi confidentialité), accessibilité (RGAA), médiation.
- [x] **`app/(public)/confidentialite/page.tsx`** : fallback réécrit en politique de confidentialité RGPD complète. Sections : responsable de traitement (Collectif Maintenant), DPD (placeholder), principes (pas de traceur, EU, consentement granulaire, minimisation), données collectées par niveau d'engagement, durées de conservation, droits RGPD complets (accès, rectification, suppression, opposition, retrait consentement, portabilité, directives post-mortem), réclamation CNIL, cookies (fonctionnels uniquement), modifications.
- [x] **Placeholders éditables conservés** pour les coordonnées factuelles que seul·e Lilou/Ben peut fournir : adresse postale, courriel contact, téléphone, DPD nominal, RNA/SIREN futurs, directeur·rice publication.
- [x] **Mécanisme CMS préservé** : les deux pages passent par `PageEditorialeCMS` avec une `cle` stable (`page.mentions-legales` / `page.confidentialite`). Lilou/Ben pourra réviser via le CMS sans toucher au code (cf. directive 0bis.8 d'éditabilité généralisée).
- [x] **Aucune cassure de fonctionnalité existante** : 918 tests verts, lint propre, typecheck vert.

## Non livré (et pourquoi)

- [ ] **Espace profil de base** : déjà existant et plus complet que ce que demandait le Master Plan. 28 pages (dashboard, informations, confidentialité, contributions, mes-creations, communes, mes-groupes, reservations, demandes-reservations, notifications-recues, notifications, decider, securite/2fa). Rien à faire ce soir.
- [ ] **Wallet 99-coin en lecture seule** : le Master Plan §3.1 (description Phase A-bis) mentionne « l'emplacement du wallet en lecture seule (l'affichage du solde 99-coin, sans wallet intégré) ». Or l'onglet « Wallet T99CP » a été retiré au chantier V2.1.1 (cf. commentaire dans `app/(membre)/profil/NavOnglets.tsx:15-18`) car le §19 du cycle V2 proscrit tout wallet intégré côté plateforme. La cohérence Master Plan/V2.1.1 reste à clarifier avec Lilou/Ben : faut-il rétablir un affichage en lecture seule (lecture RPC blockchain publique) ou maintenir la redirection vers `the99coinproject.org` ? **Décision reportée**, marquée `// CHANTIER-EN-ATTENTE-DE-DÉCISION-LL/B` mentale, à arbitrer au matin.

## Contenus à arbitrer (placeholders dans les fallbacks)

- [ ] `app/(public)/mentions-legales/page.tsx` : adresse postale, courriel contact, téléphone, numéro RNA (post-constitution), directeur·rice publication (désignation collégiale).
- [ ] `app/(public)/confidentialite/page.tsx` : courriel contact RGPD, nom et courriel DPD (désignation collégiale du collectif).

Note : ces placeholders sont visibles dans le texte (`[à compléter]`) et marqués ostensiblement. Lilou/Ben pourra les remplir directement via le CMS sans toucher au code.

## Décisions techniques

- **Pas de nouveau code, pas de nouvelle route** : juste deux fallbacks textuels enrichis. C'est la solution minimale qui respecte la directive 0bis.7 anti-arrêt (pas de chantier inutile, pas de complexité ajoutée) tout en débloquant officiellement le cadre juridique.
- **Cadre juridique sourcé** uniquement depuis le Master Plan §4.3 (lui-même issu de Lilou/Ben). Aucune invention politique ou juridique. Conforme à la règle de non-invention §3 du CLAUDE.md.
- **Pas de tirets cadratins** dans les nouveaux textes (règle d'écriture §10).

## Tests

- **918 tests verts** (inchangé par rapport à V2.5.1).
- **Lint biome** propre sur les 2 fichiers modifiés.
- **Typecheck** global vert.

## Notes pour les chantiers suivants

- Lilou/Ben pourra remplir les placeholders directement depuis le CMS de la console admin éditoriale (`/admin/national/contenus`).
- La question du wallet 99-coin en lecture seule est à trancher avant la Phase E (tunnel pétition→adhésion→commune) si l'adhésion T99CP doit afficher un solde.
