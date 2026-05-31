# Revue 2026 — Bloc 1 : Synthèse des cahiers des charges

> Document de référence produit en lecture de **tout** le pack CDC V2 (`docs/cdc-v2/`, fiche par fiche + fondations) et des specs V1 (`docs/specs/`). Objectif : reconstituer la logique générale, l'architecture cible, les invariants, le vocabulaire et la doctrine, puis fournir une **checklist de conformité consolidée** (§14) qui sert d'outil au Bloc 2 (audit code ↔ CDC).
>
> Méthode : 4 sous-agents ont lu les sources en parallèle ; cette synthèse compile leurs retours. Préséance des sources (CLAUDE.md §0) : doctrine de greffe > CDC V2 (architecture) > specs V1 (le reste) ; **le vocabulaire et les règles d'écriture priment partout**, même sur le V2.

---

## 1. Logique générale du projet

**Maintenant!** est une plateforme citoyenne (Next.js 14 / Supabase, région Francfort). Trois couches sédimentées : **V0** (Base44, abandonnée), **V1** (le code actuel, ~46 tables, phases 0-13 livrées, réseau social inclus), **V2** (doctrine cible formalisée dans `docs/cdc-v2/`).

Trois règles de comportement surplombent tout :
1. **Doctrine de greffe** : on **additionne**, jamais on ne soustrait ; on **backfille**, jamais on ne réinitialise ; le grand modèle tronc `Objet`/`Espace` est une **cible**, pas un chantier (aucune migration lourde sans décision nominative).
2. **Local strict jusqu'à la Phase M** : aucune écriture sur le distant de Francfort (17 746 signatures, 35 011 communes, 15 737 profils intouchables).
3. **Non-invention du fond** : placeholders CMS visibles, jamais de texte politique inventé.

**5 espaces + transverses** : S'informer, Mobiliser, S'entraider, Agir, Comprendre (transverse) + Carte unifiée + Agenda agrégé.

---

## 2. Principes transversaux V2 (`principes-transversaux-V2.md`, 19 principes)

- **§0** Plateforme = **commun** réutilisable (AGPL-3.0) ; privilégier le généralisable.
- **§1** Deux pouvoirs : **MOUVEMENT = délégation démocratique** (vote, mandat) ; **PLATEFORME = cooptation** (technique/modération/admin) sans **aucun** droit politique.
- **§2** Paiement unifié, deux régimes : **A** (direct entre personnes, l'argent ne transite pas) / **B** (collecte vers une **Caisse** du mouvement). « 99-coin toujours proposé, jamais euro exclusif ».
- **§3** **Espace agrégateur universel** : tout espace crée/contient tous les objets, via un composant unique (DRY) ; un espace *référence* des objets, ne les possède pas.
- **§4** **Rattachements multiples à double consentement** (graphe, pas arbre) ; **fork** = couper un lien sans rien détruire.
- **§5** Cartographie **deux sources** (MapLibre) : communes référentiel (35 000+) + espaces non territoriaux peuplés par l'usage.
- **§6** Deux réseaux sociaux : des **personnes** + des **espaces**.
- **§7** **Mini-blog/actualités** sur presque tout objet/espace ; écriture réservée créateur·ice + mandataires.
- **§8** Modération **trois régimes** : a priori (pétitions, campagnes) / a posteriori (mobilisations, cagnottes, réseau, marché, moments) / éditoriale (médias).
- **§9** Back-office standardisé : **délégation granulaire** (cases à cocher) + **intégration ascendante** (« intégrer dans une campagne »).
- **§10 (POINT DUR)** Partage + **Open Graph généré CÔTÉ SERVEUR** sur chaque page partageable (titre + description + image) ; à tester réellement.
- **§11** **Image par défaut systématique** : vraies images génériques **par type d'objet**, pas des pictos.
- **§12** **Location mutualisée** : organisateur « tampon », **euros exclusivement**.
- **§13** Statut utilisateurs : profil silencieux / membre non actif (CG) / **membre actif** (vote). **Compteur public = membres actifs uniquement**.
- **§14** **Message d'amorce** pré-rempli personnalisable à tout premier contact (réservation, service, achat).
- **§15** Ergonomie vitrine : mettre en avant le cas simple/universel ; spécialisés discrets.
- **§16** **Pas de suggestion par simple proximité géographique**.
- **§17** Identifiants : individu **M+7**, organisation **ORM+5**, espace **ESM+5**.
- **§18** **Fil de discussion de groupe** distinct du DM individuel.
- **§19** **99-coin entièrement externe** : **aucun wallet intégré** (la V1 en a des bouts → à retirer), redirection vers la **home** `the99coinproject.org/` (jamais d'URL profonde), vérification au retour (hash existe + bon montant + **hash unique**), solde en lecture seule visible de l'utilisateur seul, **adresse `0x…` jamais exposée**.

**14 composants réutilisables** visés : agrégateur, mini-blog, rattachement (graphe/fork), back-office, partage+OG, paiement unifié, carto 2 sources, message d'amorce, location mutualisée, réservation, image par défaut, fil de groupe, groupe d'objectif mutualisé, agrégateur à familles d'outils.

---

## 3. Modèle de données cible (`schema-donnees-V2.md`, D1-D13)

**Le tronc générique `Objet`/`Espace` est une CIBLE (Vague 5, reportée), PAS implémenté.** La V1 garde ~46 tables métier.

- **D1** Profil ≠ Compte (deux entités, relation 1-1). Profil porte l'identité durable (M+7, `email_confirmé_au_moins_une_fois`).
- **D2** `Espace` générique (`type`, `config` JSON) + table `OutilActivé` (activer un outil = une ligne, jamais une migration).
- **D3** `Rattachement` = graphe orienté typé + `statut` (demandé/accepté/refusé/retiré). Double consentement ; fork = `statut→retiré`, historique gardé.
- **D4** `Organisation` = profil-organisation (ORM+5) + entité `Mandataire`. On ne se connecte jamais en tant qu'organisation.
- **D5** Objet↔espaces : `createur_profil_id` + `espace_origine_id` + liaison `ObjetEspace` (role origine/relai/héberge, statut proposé/accepté/retiré).
- **D6** Objets : tronc `Objet` + `config` + tables filles (`PetitionDetail`, `CagnotteDetail`…).
- **D7** `Transaction` : `regime` (A/B), `canal` (euro/99-coin), tables filles `DetailStripe`/`DetailPolygon` ; entité `Caisse` (par type + par cagnotte) + `ReceptacleCaisse` daté.
- **D8** `Réservation` (machine à états `proposée→acceptée/refusée→réalisée→confirmée/annulée/litige`), `Message`+`FilDeGroupe`, `Relation` (ami/follow), `Consentement` (granulaire, révocable).
- **D9** `Signature` : lien profil + `snapshot` JSON + `compte_immediatement` (compte avant confirmation email).
- **D10** `Droit` (atomique : profil/cible_type/cible_id/type_droit) + `journal_admin` append-only.
- **D11** Dons : `payeur_profil_id` **non nullable** (nouveaux dons), `afficher_nom` = masquage social seulement.
- **D12** Reversements : transactions sortantes multiples ; **D12bis : justificatif OBLIGATOIRE**.
- **D13** `type_lien` ∈ {fédère, relaie, soutient, héberge} ; espace = ESM+5 ; liste fermée d'outils activables.

---

## 4. Matrice de droits (`matrice-droits-V2.md`, MD0-MD6)

Couvre **uniquement le pouvoir de plateforme** (jamais le politique).

- **MD0** Pouvoir politique (voter, mandater) dérive du **statut + mandat**, **jamais une case à cocher**.
- **MD1** Droits atomiques (`type_droit`) + presets (Rédacteur·ice, Modérateur·ice, Éditeur·ice média, Gestionnaire d'espace, Trésorier·ière).
- **MD2** Un droit porte sur **une cible précise** `(cible_type, cible_id)` ; un droit sur l'espace ne couvre pas ses objets (sauf `administrer_espace` borné à la config).
- **MD3** Non-élévation (on n'accorde que ce qu'on a) ; verrou `gerer_droits` (sauf admin plateforme) ; tout tracé dans `journal_admin`.
- **MD4** Créateur d'**objet** : modifier/supprimer/gérer image, **PAS `gerer_droits`**. Créateur d'**espace** : administrer + `gerer_droits` **sur son espace**.
- **MD5** Admin total (Lilou/Ben) : **2FA renforcée + journalisation + double validation des actions destructrices**. Cercle coopté à droits granulaires.
- **MD6** **Aucun héritage de droits** le long du graphe ; jamais de requête récursive.

---

## 5. Exigences transversales UI (`01b-EXIGENCES-TRANSVERSALES-UI.md`, ET1-ET4)

- **ET1** Image par défaut systématique (vraies images par type, pas pictos). → *fait au chantier V2.6.27.*
- **ET2** **Upload partout** (vrai bouton, jamais « collez l'URL ») via un composant unique `TeleverseurImage` ; formats JPEG/PNG/WebP ; validation du **type réel**.
- **ET3** Bascule **clair/sombre** visible dans la nav principale ; `personne.mode_theme` (auto/light/dark) ; pas de couleur en dur hors tokens.
- **ET4** Dégradé signature via tokens `--grad`/`--shadow-brand` (ne pas toucher) ; réservé à l'action primaire.

---

## 6. Organisations (`organisations-V2.md`)

Créer **en son nom** ou **au nom d'une organisation/commune**. Identifiant **ORM+5**. **Mandat obligatoire** (case « je suis mandaté·e par X », tracée, sinon création impossible). Multi-mandataires (chacun un M+7). Email partageable individu+orga (pas d'alerte doublon ; choix à la connexion). Organisations **ne votent pas** par défaut. Traçabilité du profil individuel réel sur tout contenu « porté par X ». *(Livré en partie : cycle réseau V2 chantier B.)*

---

## 7. Espaces et sous-espaces (règles clés à implémenter)

### Mobiliser
- **Pétitions** : modération **a priori** ; profil unifié M+7 créé à la signature ; compteur compte **avant** confirmation email ; **compteur stretch ×1,5 au franchissement de 90 %** ; 2 cases RGPD indépendantes facultatives ; téléphone « (pour agir avec nous) » ; export journalisé ; création au nom d'une orga possible. *(V1 mûr ; pétitions à 10 000 car. + objectif 10 M = V2.6.20.)*
- **Cagnottes** : modération **a posteriori** ; jauge **euros ET 99-coin** (parité 1:1 à l'affichage) ; régime B (Caisse) ; reversements sortants + **justificatif obligatoire** ; frais **5 % euros / 0 % T99CP** ; Stripe Connect/KYC pour bénéficiaires.
- **Mobilisations** : a posteriori ; inscription + collecte non-membres (newsletter taggée) ; agenda.
- **Campagnes** : a priori ; modules combinables ; intégration ascendante (moment/mobilisation → campagne) ; double relation pétition↔campagne.

### S'informer
- **Décider** : 3 modes hiérarchisés **Consensus → Levée d'objections → Jugement majoritaire** (mentions Excellent…À rejeter, médiane gagne, max 10 propositions) ; LiveKit ; **votes anonymes par construction** (`vote` sans `personne_id`, token purgé) ; fenêtre 10 min.
- **Maintenant Médias** (avec S) : modération **éditoriale** ; journal-affiche imprimable A3/A4 ; vivier alimenté par les mini-blogs.
- **Réseau social** : commentaires polymorphes `commentaire_objet` ; **amitié stockée** (`amitie`) distincte du suivi ; messagerie **verrouillée par défaut entre ami·es** ; flux **moi → ami·es → ami·es d'ami·es → suivi·es → reste** ; pas de pub ni algo caché.
- **Sondages** : 2 modes (classique / pondéré) ; qualification progressive du profil (panel 22 questions, opt-in itératif).

### S'entraider (paiement direct, régime A)
- **Marché solidaire** : article seul OU boutique ; gratuit/99-coin/euros ; **frais de port en POL** (pas T99CP) ou Stripe euros ; **aucune commission** ; avertissement TVA ; anti-saturation vêtements ; notation 5 étoiles.
- **SEL** : prix **par minute**, **plancher ≥ 1 sauf gratuit** ; parité **1 T99CP = 1 min = 1 €** ; solde on-chain privé ; adresse `0x…` jamais exposée ; vérif hash unique.
- **Transport** : covoiturage individuel (vitrine) + **Covoit'groupe** (règle de paiement commune) + transport matériel + **location mutualisée (euros only)** ; carte = marqueurs **au départ uniquement**.
- **Hébergement** : 3 axes (échelle/durée/lieu) ; **mail vérifié des deux côtés** ; réservation D8 + calendrier ; paiement périodique (temps long) ; croisement **campagne→hébergement OUI, hébergement→manif NON** ; structure assurance présente mais **inactive**.
- **Prêt** : 3 états (Disponible / En cours de prêt / Indisponible) ; durée max + quantité ; **pas de caution, pas de livraison** ; euros obligatoires si contrepartie ; **groupe de prêt** = composant partagé avec Covoit'groupe.
- **Fruits de la terre** : surplus alimentaire **local** ; esprit don ; moments solidaires alimentation réutilisés ; jardin partagé.
- **Groupe d'entraide local** : agrégateur **paramétré** (entraide + moments + mobilisations, hors pétitions/Décider) ; porte d'entrée non-politique ; fil de groupe.

### Agir
- **Adhérer** : 3 chemins (gratuit / T99CP / 12 €) = **mêmes droits** ; modale d'amorce **une seule fois par type d'acte** (après confirmation mail) ; commune en deux temps (adhésion commune gratuite, jamais « seulement », puis modale « également adhérer au mouvement »).
- **Commune libre** : agrégateur complet ; 35 011 coquilles précréées + 45 arrondissements ; pionnier garde la main **jusqu'à 5 membres** → message auto + structuration ; **binôme paritaire via Décider** ; OJ type 6 points ; relevé de décisions + pièces jointes ; événement récurrent (réunions).
- **Moments solidaires** : événement spécialisé + type (liste ~35, dont Gratiferia, Porte-à-porte ~4e, « Autre ») ; carto AGIR partagée sans appartenance commune ; inscription non-membres ; montée en campagne ; fiches descriptives = placeholders CMS.
- **Autres moyens d'agir** : annuaire éditorial de liens externes (CMS), par thème ; pas de suggestion utilisateur ; ~30 alternatives = placeholders.

---

## 8. Vocabulaire fixé (PRIME sur tout)

**Maintenant!** (capitale + `!`) · **Cosec gé** (jamais président·e) · **Adhérent·e** / **sympathisant·e** / **signataire** / **donateur·ice** (distincts ; pas de « membre » seul) · **99-coin (T99CP)** tiret obligatoire · **Décider** (infinitif) · **Levée d'objections** (jamais « consentement ») · **Jugement majoritaire** (Excellent, Très bien, Bien, Assez bien, Passable, Insuffisant, À rejeter) · **Moments solidaires** (pluriel) · **Commune libre** · **Assemblée Confédérale des Communes et Territoires Libres** · **Maintenant Médias** (avec S) · **Maintenant Radio** · **Marché solidaire** (jamais « marketplace ») · **Cotisation solidaire** · **Empouvoirement / Captation de pouvoir** · **Équivalence** (pas « horizontalité ») · **Moindre violence** (pas « non-violence ») · SEL : « service »/« volontariat » (jamais « travail »).

---

## 9. Règles d'écriture

**Pas de tiret cadratin (—)** (textes, commentaires, doc, MANIFEST) → deux-points/parenthèses/virgules. Pas de flèches `→` dans le corps publié. Apostrophes typographiques (’). Inclusivité par ordre : épicène > point médian > doublet > accord proximité > néologismes mots-valises **sans point** (organisateurices…), à doser. Flyer porte-à-porte **sans inclusif**. Pas de jargon académique pédant.

---

## 10. RGPD (`05_RGPD.md`)

RGPD minimale : **pas de cookie pub, pas de traceur, pas de bandeau**. Suppression différée **30 j** → anonymisation (champs nullifiés, FK conservées, « Membre anonyme »). Export ZIP (6 entrées). Email vérifié bloque adhésion/création/signature authentifiée. **2FA obligatoire** rôles moderation/admin/tresorerie. **≥ 15 ans** sans accord parental. **Turnstile** sur tous les formulaires publics. `journal_admin` (ancien/nouvel état, 3 ans). Visibilité **par champ** (public/membres/ami·es/privé) ; email jamais exposé aux modérateurices. Votes Décider anonymes.

---

## 11. Doctrines produit/UX (`06_DOCTRINES.md`)

Pas de leader/bureau visible · pas de hiérarchie utilisateurice/bénéficiaire · pas de modération IA · pas de gamification (badges/points/streaks) · **max 2 mails/semaine** (mardi récap + vendredi newsletter, 3 j d'écart) · push opt-in · **pas d'autoplay vidéo, pas de carousel auto, pas de parallax** · indicateurs collectifs (pas de classement compétitif) · équivalence (voix égales) · moindre violence (modération nuancée) · liens externes `target=_blank rel=noopener`.

---

## 12. Stack & patterns (`02_STACK.md`)

Next.js 14 App Router · TS strict (pas de `any`/`@ts-ignore` injustifié) · Supabase (Francfort) · Brevo/Stripe/LiveKit/Turnstile/MapLibre · Tailwind+CSS vars · shadcn/ui · Zod+RHF · Vitest+Playwright · Biome · **Cloudflare Pages (pas Vercel)**. Patterns : **Server Components par défaut**, **Server Actions+Zod** (API routes = webhooks), **RLS sur toute table à PII** (jamais de bypass client), 3 clients Supabase (server/client/admin), **adapter + mock par défaut** (le site tourne sans clé), nommage **français métier / anglais technique**, cible **WCAG 2.1 AA**.

---

## 13. Écarts V1→V2 connus et arbitrés (`01-REVUE-ECARTS-V1-V2.md`)

Familles A (greffe additive), B (modèle profond, **reporté**), C (coquilles). Principaux : consentements RGPD (booléens V1 → table `consentement` greffée), droits (`droit_admin` 6 niveaux → table `droit` atomique + presets), anonymat dons (D11 sur nouveaux dons), **wallet intégré à retirer** (§19), tronc Objet/Espace **non fait** (décision requise). Défauts V1 à ne pas aggraver : route groups fantômes (`app/(admin)` vide vs `app/admin`), doublon adapter paiement (`lib/payments` vs `lib/stripe`), scripts destructeurs sans `--dry-run`, RLS déportée, couleurs en dur, placeholders `[TEXTE À FAIRE]` visibles.

---

## 14. CHECKLIST DE CONFORMITÉ CONSOLIDÉE (outil du Bloc 2)

> Chaque point est vérifiable dans le code. Issu de la fusion des checklists des 4 sous-agents. Le Bloc 2 statuera : **conforme / écart / à confirmer**, avec preuve (fichier:ligne).

### A. Doctrine de greffe & données
1. Aucun `DROP` de table/colonne à données réelles (petition, cagnotte, commune, signature_petition, don, droit_admin…).
2. Aucun reset de compteur (compteurs_commune, petition_compteur, cagnotte_compteur).
3. Tout script data a `--dry-run` + confirmation + idempotence (vérifier import-communes, migrer-base44).
4. Aucune fusion dans un tronc `objet`/`espace` générique sans marqueur de décision.
5. RLS de chaque nouvelle table dans **sa propre** migration (pas déportée).

### B. Modèle de données greffé
6. Table `consentement` granulaire + RLS propre ; colonnes V1 conservées ; backfill `true` seulement.
7. Table `droit` atomique + presets ; `droit_admin` conservé.
8. Signature : `compte_immediatement` + `snapshot` ; confirmation email = attribut durable du profil.
9. Dons nouveaux : `payeur_profil_id` non nullable + `afficher_nom`.
10. `DetailPolygon`/don T99CP : **hash unique** (contrainte).
11. `Caisse` (par type + par cagnotte) + `ReceptacleCaisse` daté.
12. Reversement sortant : **justificatif obligatoire** (D12bis).
13. `journal_admin` append-only (exports, modération, **changements de droits**).
14. Identifiants M+7 / ORM+5 / ESM+5 sans collision (générateur `profil_unifie`).

### C. Droits & sécurité
15. Aucun droit politique dans `droit` (vote/mandat calculés via statut).
16. Contrôle de droit sur la paire `(cible_type, cible_id)` précise (MD2).
17. Non-élévation (MD3 R1) + verrou `gerer_droits` (MD3 R2).
18. Aucune requête récursive de droits dans le graphe (MD6, étanchéité).
19. Admin total : 2FA renforcée + journalisation + double validation destructive.
20. Preset créateur : objet sans `gerer_droits`, espace avec `gerer_droits` sur son espace.
21. 2FA obligatoire rôles moderation/admin/tresorerie.

### D. Paiement & 99-coin
22. **Aucun wallet intégré** (`/profil/wallet` retiré) ; pas de signature de tx côté plateforme.
23. Redirection 99-coin **vers la home** uniquement (jamais URL profonde) ; nouvelle fenêtre.
24. Solde T99CP lecture seule, privé ; **adresse `0x…` jamais exposée**.
25. « 99-coin toujours proposé, jamais euro exclusif » ; exceptions : location mutualisée (euros), frais de port marché (POL), SEL plancher.
26. Régimes A/B respectés (A : pas de transit ; B : Caisse).
27. Frais **5 % euros / 0 % T99CP** ; double affichage euros+99-coin partout (parité 1:1 ; piège `conversion-99coin.ts` = inutilisé en affichage).

### E. UI transversale
28. ET1 : tout objet partageable a une image (défaut par type = vraie image). ✔ V2.6.27.
29. ET2 : upload via `TeleverseurImage` partout, jamais « collez l'URL » ; validation type réel + RLS.
30. ET3 : bouton thème dans la nav ; `personne.mode_theme` ; aucune couleur en dur hors tokens.
31. ET4 : variant `primary` du Button = `--grad`+`--shadow-brand` ; tokens intacts ; dégradé réservé.

### F. Partage & Open Graph (point dur)
32. `generateMetadata` côté serveur avec `openGraph.images` sur **chaque page partageable**.
33. Trois entrées de partage (message interne, réseau, extérieur) ; lecture OG entrants.

### G. Principes structurels
34. Double consentement sur tout rattachement (statut demandé/accepté/refusé/retiré).
35. Fork = retrait unilatéral non destructif.
36. `type_lien` ∈ liste fermée {fédère, relaie, soutient, héberge}.
37. Outils activables = liste fermée (ligne `OutilActivé`, jamais migration).
38. `FilDeGroupe` présent sur tout groupe/espace, distinct du DM.
39. Message d'amorce pré-rempli personnalisable à tout premier contact.
40. Pas de suggestion par simple proximité géo (§16).
41. Compteur public = membres actifs uniquement (§13).
42. Mini-blog : écriture créateur·ice + mandataires.
43. Mandat orga obligatoire + tracé ; email multi-profils sans alerte doublon.

### H. Vocabulaire & écriture (recherche textuelle)
44. « Maintenant Médias » (S) ; jamais « Maintenant Média ».
45. « 99-coin » avec tiret ; `(T99CP)` 1ère occurrence.
46. Termes fixés respectés (cosec gé, levée d'objections, adhérent·e, Décider, Moments solidaires, marché solidaire…).
47. **Aucun tiret cadratin (—)** ni flèche `→` dans textes/commentaires/doc.
48. Inclusivité conforme ; pas de jargon pédant.

### I. RGPD
49. RLS sur toute table PII ; `admin.ts` hors webhooks seulement.
50. Suppression différée 30 j + anonymisation (champs exacts, FK conservées).
51. Export ZIP `/profil/confidentialite` (6 entrées).
52. Email vérifié bloque adhésion/création/signature ; ≥ 15 ans ; Turnstile partout.
53. Visibilité par champ ; email jamais exposé aux modérateurices ; votes Décider anonymes.
54. Pas de bandeau cookies ni traceur tiers.

### J. Design & technique
55. Couleurs/typo via tokens (brand #E11D74, accent #7C3AED, hue #DC2654) ; pas de 11 hues ; Sora/Inter/JetBrains ; lucide stroke 1.5.
56. Cible tactile 44 px ; focus-visible ring ; contrastes AA clair+sombre ; `prefers-reduced-motion` ; pas d'autoplay/carousel/parallax.
57. Server Components par défaut ; Server Actions+Zod ; API = webhooks ; 3 clients Supabase ; secrets jamais côté client.
58. Adapter mock par défaut (démarre sans clé) ; TS strict.
59. Modération a priori (pétitions, campagnes) / a posteriori (mobilisations, cagnottes, réseau, marché, moments) ; pas d'IA.
60. Notifications : max 2 mails/sem (mardi/vendredi), push opt-in, regroupées.

---

*Fin du Bloc 1. Le Bloc 2 confronte ces 60 points au code réel et produit `02-conformite.md`.*
