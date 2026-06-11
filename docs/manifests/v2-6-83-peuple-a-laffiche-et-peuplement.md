# Manifest : V2.6.83, Le Peuple à l'Affiche + peuplement Maintenant Médias et pétitions

**Date de fin** : 2026-06-11
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare
**Contexte** : clarification de Ben : le générateur d'affiches (journal-affiche) s'appelle « Le Peuple à l'Affiche », distinct du média « Maintenant Médias ». Demande explicite : retrouver 4 articles dans les archives et les publier dans le média ; retrouver textes et images des pétitions placeholder dans Telegram et l'historique Facebook.

## Livré et fonctionnel

### Renommage (code, déployé)
- [x] Journal-affiche renommé « Le Peuple à l'Affiche » partout : page /s-informer/journal (titre, metadata), carte du hub S'informer, lien footer, console admin (/admin/national/journal + carte console nationale), metadata des fiches d'édition, lien croisé sur la page média, config espaces.
- [x] Espace média aligné sur le vocabulaire fixé : « Média Maintenant » → « Maintenant Médias » (hub, page, metadata, test E2E).
- [x] **Bloc « Article à la une » de l'accueil recâblé** : il lisait les éditions du journal-affiche (table journal_affiche) ; il lit désormais les articles de Maintenant Médias (table media, épinglé admin sinon dernier publié), liens vers /s-informer/media. Le bouton « À la une » a migré de la fiche d'édition du journal vers la fiche article du média.
- [x] Footer : lien « Maintenant Médias » (/s-informer/media) AJOUTÉ, lien « Le Peuple à l'Affiche » (/s-informer/journal) renommé.

### Peuplement (données distantes, autorisé explicitement par Ben)
- [x] **4 articles publiés dans Maintenant Médias** (textes authentiques recopiés verbatim depuis leurs sources, images de couverture extraites des exports Facebook de Ben et téléversées dans le bucket media, chemin peuplement/couverture/) :
  1. « Appel à soutenir, amplifier et prolonger la mobilisation du 10 septembre » (tribune, 2025-08-11, source : tribune Regards du 11 août 2025, liste complète des signataires laissée chez Regards avec lien).
  2. « L'APRÈS c'était mieux avant ! » (tribune, 2025-12-05, Benjamin Ball, source : archive l2b2 36.txt datée).
  3. « Quentin Deranque : le jeune homme et le néonazi » (tribune, 2026-02-17, Benjamin Ball, source : post LinkedIn archivé, image du post Facebook).
  4. « Bally Bagayoko, la République c'est lui ! » (article, 2026-04-21 approximatif, Benjamin Ball, source : post Facebook intégral, image du post). NB : la ligne finale « Article à lire sur Maintenant Media » du post original a été omise (auto-référence vers l'ancien site).
- [x] **Pétition Epstein** (slug epstein, 13 745 signatures INTACTES) : vrai titre « Fichiers Epstein : Nous voulons l'ouverture d'une commission d'enquête », destinataire « Yaël Braun-Pivet, Présidente de l'Assemblée Nationale », texte intégral verbatim (post Facebook d'annonce de la pétition), image de campagne (« 5000 signatures en 36 heures »).
- [x] **Pétition antifasciste** (slug antifasciste, 1 755 signatures INTACTES) : vrai titre « Après le 18 décembre, pour l'égalité des droits, contre le racisme et le fascisme, on continue ! », texte intégral verbatim (fil Telegram trié 0441_On-Ne-Veut-Plus.md, paragraphes restitués sans changer un mot).

## Non livré (et pourquoi)
- [ ] **Pétition Baranoux** : titre réel confirmé (« Sauvons le Baranoux, lieu de convivialité engagé au cœur d'un quartier populaire, menacé d'expulsion ») mais seul le DÉBUT du texte existe dans les archives (aperçu de lien tronqué dans Telegram) ; le texte intégral n'est ni dans Telegram, ni dans les 2 exports Facebook, ni dans la Wayback Machine. **Ben : peux-tu fournir le texte (ou me dire où le chercher) ?**
- [ ] **Pétition Cuba** : aucune trace du sujet ni du texte dans les archives explorées (54 mentions Facebook de Cuba, toutes hors sujet). **Ben : de quoi parlait-elle ?**
- [ ] **Destinataire de la pétition antifasciste** : pas de destinataire dans le texte d'origine (appel public) ; le kicker affiche encore « [DESTINATAIRE À METTRE] ». À arbitrer (par exemple un destinataire symbolique, ou adapter l'affichage).
- [ ] **Doublon Epstein** : la pétition jumelle « fichiers-epstein-... » (0/15 000, créée en février) coexiste avec la principale restaurée. Recommandation : la retirer ou la fusionner ; non fait (consigne « ne rien dépublier » et décision de fusion = porte Ben).

## Contenus à arbitrer
- Dates de publication : Bagayoko posé au 2026-04-21 (date approximative du post Facebook, modifiable en console admin) ; les 3 autres dates sont documentées.
- Types : Appel/L'APRÈS/Deranque en « tribune », Bagayoko en « article » ; requalifiables en un clic dans la console.
- L'en-tête du hub S'entraider garde son petit titre (pas de Heading géant) : harmonisation visuelle à décider.

## Tests
- Unitaires : 1045 verts. Lint : propre (18 warnings préexistants). Typecheck : vert.
- Vérifié en production après déploiement : /s-informer/media (titre + 4 articles signés/datés), /s-informer/journal (« Le Peuple à l'Affiche »), accueil (« Article à la une » = Bagayoko avec photo, lien « Voir Maintenant Médias »), liste des pétitions (Epstein restaurée avec image et 13 745 signatures, antifasciste restaurée).

## Notes pour les chantiers suivants
- Les sources extraites (posts Facebook JSON, images, scripts d'extraction et de publication) sont dans `data-migration/` (gitignoré, PII) : facebook-posts/, images-peuplement/, publier-peuplement.mjs.
- L'export Facebook HTML de l'ancien PC (Bibliotheque/00_SOURCES/ancien-pc/à trier/Bureau/Nouveau dossier (2)/) couvre des posts plus anciens que les zips de juin : utile pour de futures recherches d'archives.
