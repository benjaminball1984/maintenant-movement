# Bilan de la nuit du 29 au 30 mai 2026

> **Pour Lilou/Ben au réveil.** Lecture utile : 2 minutes.
> Pour le détail chronologique : `docs/JOURNAL-NUIT-2026-05-29.md`.

## Ce que tu trouveras au réveil

**9 chantiers livrés**, tous commités sur `main`, tous tests verts. Tip de départ : `3b2826a`. Tip final : `3bfc438`. Vérification rapide :

```bash
git log --oneline 3b2826a..HEAD
```

## Récapitulatif des 9 chantiers

| Chantier | Tip commit | Description | Livré |
|---|---|---|---|
| V2.5.0 | `3b2826a` | Adoption Master Plan V2.6, 8 directives intégrées au CLAUDE.md, mémorialisation des arbitrages | ✅ Complet |
| V2.5.1 | `7433c27` | **Phase A — Données de démo** : 6 profils Auth, table `objet_demo`, seeding par espace, 14 tests | ✅ Complet |
| V2.5.2 | `c6b62a1` | **Phase A-bis — Cadre juridique** : Collectif Maintenant dans mentions légales + politique de confidentialité RGPD | ✅ Complet |
| V2.5.3 | `bd1a188` | **Phase B — Identité** : wordmark dégradé dans le footer, emplacement logo | ✅ Partiel (manque le vrai logo poing levé + coquelicot, à fournir) |
| V2.5.4 | `83b5283` | **Phase C — Gabarit riche** : image de couverture sur commune + fédération | ✅ Partiel (manque boîte à outils universelle module_espace) |
| V2.5.5 | `8b52889` | **Phase D — Blocs newsletter** : système complet (migration + helpers + composant + seeding démo + 14 tests) | ✅ Fondations complètes, manque éditeur UI admin |
| V2.5.6 | `5e09a66` | **Phase E — Tunnel pétition** : CTA adhésion + commune dans l'écran de merci | ✅ Partiel (manque page de confirmation pré-remplie) |
| V2.5.7 | `6ed8be0` | **Phase F — Invitation virale** : 6 boutons de partage (WhatsApp, Telegram, Messenger, Signal, Email, Mastodon) sur la page pétition + 9 tests | ✅ Complet |
| V2.5.8 | `3bfc438` | Extension du moteur de partage à mobilisations + cagnottes + état Phase G documenté | ✅ |

**Total** : 941 tests verts, 0 régression, typecheck propre, lint propre.

## Ce que tu peux voir tout de suite (chemin recommandé)

1. **Lance le site** : `npm run dev` puis `http://localhost:3000`. Tu dois voir le site peuplé (6 pétitions démo, 6 mobilisations, 6 cagnottes, 6 sondages, 6 communes, 20 publications réseau).
   - **Préalable Supabase** : laisse Docker Desktop ouvert. Si Supabase n'est plus démarré, relance `npx supabase start -x realtime -x storage -x analytics -x edge-runtime -x imgproxy -x inbucket -x vector -x functions`.

2. **Connecte-toi en tant que profil démo** pour voir le site avec les yeux d'un membre : email `test1@maintenant.local`, mot de passe `demo-test1!` (de test1 à test6).

3. **Va voir une commune démo** (ex. `/agir/communes/demo-argenteuil-95`) : tu verras les 3 blocs newsletter (texte de bienvenue + lien WhatsApp + bouton visio) + la liste des membres (test1).

4. **Va sur une pétition publiée**, signe-la (avec une fausse identité), et observe l'écran de merci enrichi : 2 CTA pour l'adhésion et la commune.

5. **Vérifie le moteur de partage** : sur n'importe quelle pétition, mobilisation ou cagnotte publiée, scroll en bas pour voir les 6 boutons de partage.

6. **Footer** : ouvre n'importe quelle page et regarde le pied de page. Le mot « Maintenant! » est désormais en dégradé violet-magenta-framboise.

## Ce qui reste à faire (par ordre de priorité décroissante)

### Urgent (à faire par toi, pas par moi)

- **Logo officiel** : coller `maintenant.svg` dans `public/logo/`, remplacer le wordmark dans `components/layout/Footer.tsx` par `<Image>`. ~5 min.
- **Coordonnées RGPD** : remplir les placeholders `[adresse à compléter]`, `[courriel à compléter]`, `[DPD à désigner]` via le CMS (`/admin/national/contenus`) sur les pages mentions-légales et confidentialité.
- **Pousser les migrations sur le distant** : quand tu seras prêt·e à mettre en ligne, suivre la procédure Master Plan §M (sauvegarde `pg_dump` d'abord, puis `supabase db push`). Migrations en attente : `20260529000000_objet_demo.sql`, `20260530000000_bloc_espace.sql`, plus les ~10 déjà en attente.

### Important (chantiers ultérieurs)

- **Phase G UI** (V2.5.8.a) : bouton « intégrer cette pétition à une campagne » avec modale. La mécanique est codée, manque juste l'UI. Spécifié dans `docs/manifests/v2-5-8-phase-G-extension-partage.md`. ~30-45 min.
- **Page de confirmation pré-remplie** (V2.5.6.a) : pour parfaire le tunnel pétition→adhésion. ~1h.
- **Phase H** (double visage réseau/espace d'action) : gros chantier, à programmer avec moi en une session dédiée.
- **Phase I** (embellir marché, transport, hébergement, fruits de la terre, SEL, prêt) : 6 espaces à styler comme leurs leaders grand public. Une nuit complète chacun ou deux par nuit.
- **Phase J, K, L** : design réseau social, console CMS, gabarits emails.

## Points de friction rencontrés cette nuit (résolus)

1. **Docker Desktop pas en marche au démarrage** : tu l'as lancé avant ton coucher (merci). Sans cela, j'aurais dû tout coder en mocks Vitest, sans test end-to-end réel.
2. **Supabase local 1ʳᵉ tentative échouée** : réseau Docker orphelin, services analytics/realtime/storage en `unhealthy`. Résolu en excluant ces services au démarrage. Pour les redémarrer plus tard si besoin : enlever les `-x` correspondants.
3. **Régénération `types/database.ts` qui a écrasé les extensions custom** : revert puis insertion manuelle de chaque table. À retenir : `types/database.ts` est maintenu à la main, c'est documenté dans CLAUDE.md §11.
4. **Plusieurs contraintes CHECK mal devinées au seeding** (cagnotte.type, sondage.mode, sondage.statut, appartenance_commune DEFERRABLE) : corrigées en lisant les migrations source. Désormais documenté.

## Question reportée pour ton arbitrage

**Wallet T99CP en lecture seule** : le Master Plan §A-bis dit « affichage du solde 99-coin en lecture seule (sans wallet intégré) ». Or le chantier V2.1.1 a retiré complètement l'onglet « Wallet T99CP » (cf. commentaire dans `app/(membre)/profil/NavOnglets.tsx:15-18`) en s'appuyant sur le §19 du cycle V2 qui « proscrit tout wallet intégré côté plateforme ». Il faut clarifier :
- **Option A** : on rétablit un onglet « 99-coin » en LECTURE SEULE qui appelle une RPC blockchain publique (Polygon) pour afficher le solde de l'utilisateur·ice si iel a renseigné une adresse wallet. Aucune signature, aucun envoi.
- **Option B** : on garde la décision V2.1.1 (pas d'affichage du tout côté plateforme, redirection externe vers `the99coinproject.org` pour voir son solde).

Je n'ai pas tranché et j'attends ta décision avant la Phase E complète (qui propose l'adhésion T99CP).

## Mot de fin

Soirée et nuit denses, mais utiles : on est passé de 0 phase Master Plan en début de nuit à 8 phases livrées (totalement ou partiellement) avec 941 tests verts. La doctrine de greffe (§0.3 CLAUDE.md) est respectée à 100 % : aucune donnée existante touchée, tout additif. La règle locale stricte (§11 Master Plan adopté) est respectée à 100 % : aucune écriture sur Francfort.

Repose-toi bien. Quand tu seras prêt·e, on enchaîne sur les Phases H, I, J, K, L. Ou tu arbitres les chantiers ultérieurs (V2.5.8.a UI campagne, V2.5.6.a page confirmation, wallet T99CP) en priorité, à ta discrétion.

— Claude Opus 4.7 (1M context)
