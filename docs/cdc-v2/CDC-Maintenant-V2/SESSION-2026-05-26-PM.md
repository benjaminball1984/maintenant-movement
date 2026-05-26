# Markdown de fin de session — 2026-05-26 (après-midi → soir)

> Site Maintenant! — Cahier des charges V2. Espaces S'informer (fin) + Agir (entier).
> Signature : LIFE BENJAMIN BALL.

---

## Ce qui a été fait (session énorme)
**S'informer ENTIÈREMENT bouclé** (Maintenant Médias, Sondages, Réseau social) **+ Agir ENTIÈREMENT bouclé** (Adhérer, Commune libre, Moments solidaires, Autres moyens d'agir). Pas de code, uniquement le CDC. Questions une par une.

## Maintenant Médias
Objet unique « le média des 99 % », 3 manières de le vivre (national / local / affiche). Rédaction cooptée, tout passe par elle. 3 sources (rédaction propre / curation externe avec règle de droit + nouvel onglet référent / curation interne blogs). Bouton « Proposer un contenu ». Radio EN LIVE (AzuraCast). Mode affiche : formats 1×2/2×3/4×4 feuilles, N&B/bichromie/couleur + prévisu, esthétiques = 30 modèles Canva→HTML. Impression maison gratuite ; livraison nationale = contribution/don (pas vente), service à l'adhérent·e, association opératrice, 99-coin+POL ou €+€, plafond 100, anti-abus POL.

## Sondages
Méthode combinée (tirage équilibré âge×zone + pondération résiduelle raking, seed serveur). Affichage : marge d'erreur (n_eff) + étoiles 2 décimales + mention « sondage participatif en ligne ». 3 paliers DYNAMIQUES lissés (brut <500 plafond 1,5 ; partiel 500-1000 plafond 3 ; complet >1000 jusqu'à ~4,8), note continue par saturation, raccord sans saut, peut redescendre. **Double présentation visuelle** : barres simples (brut/partiel) ; barres à segment d'incertitude calculé par option (complet). Fiche méthodo téléchargeable (brutes agrégées RGPD). Boîte noire croisement = ADMIN only, masquage <5. Créateur = titre/options/pictos/description, ne recontacte pas. Confirmation vote par email + qualification progressive (1 Q aléatoire/passage, pondérée vers les utiles, jamais 2× la même). **Panel 22 questions** (14 socio + 4 politiques + 4 engagement ; religion/origine ethnique EXCLUES → patrimoine + origine sociale). **38 listes européennes 2024 figées et vérifiées** (intitulés officiels ministère Intérieur).

## Réseau social
Flux 5 rangs, grille 7-5-4-3-1/20, report proportionnel, tri intra-rang multiplicateur log 1→3 (commentaire 3/partage 2/like 1), snapshot+cache anti-emballement. Lives intégrés (embed LiveKit/PeerTube/YouTube/Twitch, pas hébergés). Uploads : texte/emoji/sticker/GIF/image/audio 10min/documents ; vidéo NON hébergée (embed). Sécurité liste blanche + type réel + assainissement. Méga-édito vidéo admin (Cloudflare Stream, en tête, option push messagerie, droit collectif humain pas codé). Blocage + profil privé (règle du plus restrictif). Signalement a posteriori + flux priorisé + « pas de problème » anti-meute. Notes factuelles = commentaires annexes avec sources obligatoires (pas alerte). Partage natif (messagerie/groupes/profil, tag oui, dépôt sur profil d'autrui non) vs externe (menu). Notifications déjà actées (19/05).

## Agir
- **Adhérer** : 3 chemins droits égaux ; modale 1×/type d'acte ; commune en 2 temps sans « seulement ».
- **Commune libre** : précréées (35k + 45 arrondissements, déjà en carto V1) + création libre (rattachement géo obligatoire) ; pionnier jusqu'à 5 ; seuil 5 → binôme paritaire via Décider + ordre du jour type (présentations→charte→1ère action→représentant·es→fonctions admin→périodicité) ; réunions à l'heure ; canevas relevé de décisions ; agrégateur complet.
- **Moments solidaires** : doctrine contrepoids anti-bureaucratique (lien sans intermédiation, carto partagée) ; événement spécialisé ; ~27 formats à plat + Autre ; organiser=membre du territoire / participer=ouvert ; porte-à-porte = fiche 7 étapes + incitation appuyée à créer une campagne.
- **Autres moyens d'agir** : annuaire éditorial de liens, cooptée, suggestions organiques, ~30 alternatives à finaliser, pas de Comptoir de Change ici.

## Principes transversaux
§1 enrichi (v3.2) : cooptation auto-perpétuante + analogie administration/législatif (interne, n'ouvre aucun droit politique).

## Alertes (inchangées)
1. **BACKUP Supabase distant Francfort** : prérequis bloquant, toujours pas fait. 17 746 signatures, 15 737 profils, 35 011 communes.
2. **Légicoop** : fiche méthodo sondages (seuil agrégation RGPD), service impression-livraison affiches (don).
3. **Wallet intégré** : à retirer.

## Reste à faire
- **Espace membre**, **Admin/modération**, **Transverses** (carte/agenda/notifications), **Fondations** (CMS, crons, délivrabilité, déploiement).
- Puis : plan d'implémentation, revue de code, prompt Claude Code.
- **Contenu à produire** : libellés définitifs des 22 questions ; fiches descriptives des formats de moments solidaires (dont porte-à-porte 7 étapes) ; ~30 liens « autres moyens d'agir » vérifiés.

## Prochaine session
Nouvelle conversation (contexte plein). Attaquer **Espace membre / profil**. Charger d'abord 00-INDEX.md + principes-transversaux-V2.md.
