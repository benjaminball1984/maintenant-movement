# Manifest — Cycle V2.6 : épopée réseau social V2 (commentaires, liens auteur, espaces suivables, amitié)

**Date de fin** : 2026-05-30
**Branche** : `main`
**Commits** : `6d989e5` (V2.6.1) → `b909e6e` (V2.6.11)
**Durée approximative** : 2 sessions Claude Code (nuit 29→30/05 + reprise 30/05)

Source de vérité du cycle : `docs/specs/09_RESEAU-SOCIAL-V2.md` (spec arbitrée avec Lilou/Ben). Tout est en greffe additive (CLAUDE.md §0.3) : aucune table détruite, aucun compteur réinitialisé, amitiés existantes backfillées.

## Livré et fonctionnel

### Chantier A — Commentaires polymorphes (V2.6.1, V2.6.2)
- [x] Table polymorphe `commentaire_objet (objet_type, objet_id, …)`, réservée aux connecté·es, modération a posteriori. Migration `20260531100000_commentaire_objet.sql`.
- [x] `FilCommentaires` propagé à tous les contenus (pétitions, mobilisations, cagnottes, campagnes, moments, sondages, offres entraide, SEL, produits, boutiques).

### Chantier A.2b — Auteur·ice cliquable vers le profil réseau (V2.6.3, V2.6.4, V2.6.5)
- [x] Helper `lib/reseau/lien.ts` (`numeroReseauDe`) : numéro public M+7 via `personne_affichage` (jamais masqué, c'est le handle).
- [x] Server Component `components/reseau/LienAuteurReseau.tsx` : nom cliquable vers `/s-informer/reseau/[numero]`, dégradation propre si pas de profil unifié.
- [x] Câblé sur les 10 fiches qui créditent un·e auteur·ice/proposeur·euse (pétition, mobilisation, cagnotte, campagne, offre entraide, SEL, produit, boutique, moment, sondage).

### Chantier C — Espaces communautaires suivables (V2.6.6)
- [x] Bouton « Suivre dans le réseau » (`BoutonSuivreEspace`, infra Phase H) ajouté sur fédération, GT thématique, groupe d'entraide local, campagne (la commune l'avait déjà depuis V2.5.22). Réutilise `abonnement_espace_reseau`, `basculerAbonnementEspaceAction`, `jeSuisCetEspace`. Aucune nouvelle table.

### Chantier D — Amitié stockée + messagerie verrouillée + flux re-classé (V2.6.7 → V2.6.11)
- [x] **D.1 (V2.6.7)** : table `amitie` (cycle demande → acceptation), distincte du suivi. Migration `20260601000000_amitie.sql`. **Backfill** des suivis mutuels existants en amitiés acceptées (aucun statut perdu). Helpers SQL : `est_ami_reseau` réimplémenté sur la table (signature inchangée, appelants intacts), `peut_demander_ami`, `accepter_amitie` (SECURITY DEFINER : statut + suivi mutuel forcé), `personne_affichage` redéfinie (palier « amies » sur la vraie amitié). `lib/reseau/amitie.ts` (lectures + `deriverStatutAmitie` pur, 4 tests). Server Actions `demanderAmi`/`accepterAmi`/`refuserAmi`/`retirerAmi` + notifs templées `reseau_demande_ami` / `reseau_amitie_acceptee` (CMS-éditables). UI : `BoutonAmitie`, câblé au profil, page `/s-informer/reseau/amis` (demandes reçues), lien + badge dans le header réseau.
- [x] **D.2 (V2.6.8)** : préférences `demande_ami_ouverte` et `messagerie_ouverte` (top-level de `preferences_visibilite`, défaut false). Schéma `preferencesReseauSchema`, action `mettreAJourPreferencesReseau` (fusion jsonb), UI `FormulaireReseauPrefs` + section CMS dans `/profil/confidentialite`.
- [x] **D.3 (V2.6.9)** : messagerie verrouillée. Migration `20260601010000_message_reseau_verrou.sql` : helper `peut_envoyer_message_reseau` (ami·e, OU messagerie ouverte, OU réponse à un fil déjà ouvert par l'autre) + RLS d'insertion durcie. Verrou applicatif dans `envoyerMessage` + bouton message masqué sur le profil si non permis.
- [x] **D.4 (V2.6.10)** : flux re-classé moi → ami·es → ami·es d'ami·es → suivi·es → reste. Migration `20260601020000_cercle_amical_reseau.sql` : RPC `cercle_amical_reseau` (niveau 1 = ami·es, niveau 2 = ami·es d'ami·es), nécessaire car la RLS de `amitie` n'expose pas l'amitié d'autrui. `getFluxReseau` élargit le palier à 0..4.
- [x] **V2.6.11** : dégradation propre du verrou tant que les migrations ne sont pas appliquées au distant (ne bloque que sur refus explicite).

## Écarts V1→V2 appliqués (CLAUDE.md §0.4)

- **Amitié = relation stockée, plus suivi mutuel calculé.** V1 : `est_ami_reseau` joignait deux lignes `relation_reseau`. V2 : lit la table `amitie`. **Garantie de non-perte** : backfill de toutes les paires en suivi mutuel en amitiés `acceptee` dans la migration même. `relation_reseau` conservée intacte.
- **Messagerie resserrée.** V1 : tout·e connecté·e pouvait écrire à n'importe qui. V2 : ami·es par défaut, sauf messagerie ouverte ou fil déjà ouvert par l'autre. **Additif côté données** : aucun message supprimé ; seules les nouvelles insertions sont soumises au verrou. Raffinement ajouté (non exigé par la spec mais cohérent) : on peut toujours répondre à quelqu'un qui nous a déjà écrit, pour ne pas piéger une conversation.
- **Flux ré-ordonné.** V1 : soi → suivis → reste (paliers 0/1/2). V2 : soi → ami·es → ami·es d'ami·es → suivi·es → reste (paliers 0..4). Toujours strictement transparent, sans pondération cachée.

## Non livré (et pourquoi)

- [ ] **Chantier B — Pages organisation + mandat** : NON entrepris. C'est une **porte de gouvernance** (CLAUDE.md §0bis.5, §3 : on n'invente pas les droits politiques). La spec §7 le marque « à concevoir avec Lilou/Ben » : type d'espace « organisation », création auto à la déclaration d'une organisation initiatrice, anti-usurpation par **attestation + officialisation validée** (badge officiel accordé par admin ou gestionnaire existant), rôle de gestionnaire. Décisions attendues de Lilou/Ben avant implémentation : (1) qui valide le badge officiel et selon quel processus ; (2) quels droits exacts un·e gestionnaire d'organisation obtient ; (3) que se passe-t-il en cas de revendication concurrente d'une même organisation.

## Migrations à appliquer au distant (au matin, Phase M)

Dans l'ordre, via `supabase db push` (ou le script `appliquer-sql-distant` pour le DDL pur, sans PII) :
1. `20260531100000_commentaire_objet.sql` (chantier A, déjà posée au cycle précédent)
2. `20260601000000_amitie.sql` (table + backfill + helpers)
3. `20260601010000_message_reseau_verrou.sql` (helper + RLS messagerie)
4. `20260601020000_cercle_amical_reseau.sql` (RPC flux)

Tant qu'elles ne sont pas appliquées, les fonctionnalités D restent **dormantes** sur le distant (dégradation propre, V2.6.11) : aucune régression de l'existant.

## Contenus à arbitrer

- Aucun nouveau texte politique inventé. Tous les libellés ajoutés sont utilitaires (boutons, hints) et **CMS-éditables** (clés `notification.reseau_demande_ami.*`, `notification.reseau_amitie_acceptee.*`, `s-informer.reseau.cta_amis`, `profil.confidentialite.section_reseau_*`).

## Tests

- Unitaires : 1009 verts (`npx vitest run`), dont 4 nouveaux sur `deriverStatutAmitie`.
- Lint (Biome) + typecheck (tsc) : verts à chaque commit (hook pre-commit lefthook).
- E2E Playwright : non relancés cette session (les flux D dépendent de l'application des migrations au distant ; à valider après Phase M).

## Notes pour les chantiers suivants

- **Chantier B** : reprendre avec Lilou/Ben les 3 décisions de gouvernance listées ci-dessus avant tout code.
- **Bonus livré** : `mettreAJourPreferencesVisibilite` fusionne désormais le jsonb (corrige une perte silencieuse des autres sous-clés au save de la visibilité) ; le chargement de la visibilité isole ses clés avant le parse strict.
- Quand les migrations seront appliquées, vérifier en conditions réelles : demande d'ami (cas « la cible me suit » vs « demandes ouvertes »), acceptation → suivi mutuel forcé, verrou messagerie, ordre du flux.
