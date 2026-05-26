# Session 2026-05-26 (SOIR) — Schéma de données + Matrice de droits

> Signature : LIFE BENJAMIN BALL.
> Durée : ~18h30 → 19h15. Mode : une décision à la fois, 5 options par question (à la demande de Lilou, fatigue en début de session).

---

## Objectif de la session

Reprise après le constat de fin de session précédente : avant de lancer Claude Code, il manquait des documents de synthèse (schéma de données, matrice de droits, document monétaire, machines à états, plan d'implémentation). Décision de Lilou : commencer par le **schéma de données**, puis enchaîner sur la **matrice de droits**.

---

## Ce qui a été produit

### 1. schema-donnees-V2.md (v1.0) — NOUVEAU, COMPLET

Modèle conceptuel complet (entités + relations). 13 décisions :

- **D1** Profil ≠ Compte (deux entités séparées ; colle à Supabase auth.users / profiles).
- **D2** Espace agrégateur = tronc `type` + `config` JSON + table `OutilActivé` (hybride).
- **D3** Rattachement = graphe pur (multiples, toutes natures), lien orienté + typé + config JSON.
- **D4** Organisation = Profil-organisation (ORM+5) qui PEUT posséder un Espace ; commune = Espace agissant comme orga.
- **D5** Objet ↔ espaces = créateur direct + liaison many-to-many à rôle.
- **D6** Objets agrégés = tronc commun `Objet` + config JSON + tables filles métier (résout la forme de la liaison D5).
- **D7** Transaction = DEUX RÉGIMES (A direct entre personnes / B collecte vers le mouvement) + tronc + tables filles par canal (Stripe / Polygon). Entité `Caisse`.
- **D8** Réservation, Messagerie (DM + fil de groupe), Consentement (RGPD granulaire).
- **D9** Signature = lien profil + snapshot complet JSON (valeur probante).
- **D10** Droits = table générique à cases à cocher ; JournalAdmin append-only.
- **D11** Dons = jamais d'anonymat total, profil toujours présent (nom masquable). Referme nullabilité payeur de D7.
- **D12** Reversement cagnottes = transactions sortantes multiples + justificatif OBLIGATOIRE (D12bis).
- **D13** Points ouverts D2/D3 refermés : types de liens (fédère/relaie/soutient/héberge), identifiant espaces ESM+5, liste outils fermée extensible.

### 2. matrice-droits-V2.md (v1.0) — COMPLÉTÉ, COMPLET

7 axes (MD0–MD6), pouvoir de PLATEFORME uniquement :

- **MD0** Périmètre : plateforme seulement, le politique reste dans Décider (cloison stricte §1).
- **MD1** Grain fin (cases atomiques) + presets prêts à l'emploi (calqués sur les fonctions d'admin de la commune).
- **MD2** Granularité : un droit porte sur une cible précise (objet OU espace), jamais globale (sauf compte admin total).
- **MD3** Octroi : non-élévation (on ne donne que ce qu'on a) + verrou sur `gerer_droits` + exception cooptation (admin plateforme).
- **MD4** Droits du créateur : preset différencié objet / espace ; articulé avec commune libre (main jusqu'à 5 → Décider).
- **MD5** Admin = compte total (fondateur, protégé par 2FA + journal + double validation des actions destructrices) + cercle d'admins cooptés granulaires.
- **MD6** Héritage dans le graphe = AUCUN (étanchéité totale ; anti-squat §4). Délégation explicite inter-espaces comme parade à la lourdeur.

---

## Correction de doctrine importante

**Le §2 des principes (« Maintenant! ne touche JAMAIS l'argent ») est FAUX en l'état.** Vrai pour les échanges entre personnes (régime A), faux pour les contributions au mouvement (régime B : adhésions, cotisations, dons, cagnottes solidaires → l'argent arrive bien à Maintenant!, aujourd'hui sur le Stripe existant, demain sur le compte de l'association). À AMENDER dans principes-transversaux-V2.md.

---

## Reste à faire (prochaines sessions)

1. **Amender le §2** des principes transversaux (régimes A/B).
2. **Machines à états** des objets clés (pétition, transaction, réservation, rattachement, signature) — document dédié.
3. **Plan d'implémentation** par dépendances techniques (≠ ordre du CDC par espaces).
4. Points de détail laissés ouverts dans le schéma et la matrice (listés dans chaque décision).
5. Espace membre, Admin/modération (UI), Transverses, Fondations — les blocs CDC non encore détaillés.
6. PRÉREQUIS BLOQUANT toujours actif : backup Supabase (pg_dump) AVANT toute migration V2 touchant la BDD.

---

## Note de méthode

Documents de synthèse = mise au propre de décisions déjà prises, PAS nouvelle conception. Cohérent avec l'objectif de mai (finir les chantiers ouverts, n'en ouvrir aucun). Trois patrons architecturaux recombinés partout : (1) tronc + config + tables filles ; (2) graphe à rôle/statut pour les relations ; (3) cases à cocher atomiques + presets. Économie de concepts = maintenabilité pour Claude Code.
