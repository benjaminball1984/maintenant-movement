# Manifest : V2.6.148, seconde illustration et liens cliquables dans les articles

**Date de fin** : 2026-09-24
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare
**Durée approximative** : une partie de session

## Contexte

Demande de Lilou/Ben : publier en une seule actualité la tribune « Fin du monde, fin du mois : le 17 octobre nous serons là ! » de la coordination nationale du mouvement du 26 septembre, parue le 24/09/2026 dans Regards et dans Basta!, avec les deux illustrations (celle de Regards et la photo de Nolwenn Weiler pour Basta!).

La page article ne savait afficher qu'une image (`vignette_url`) et rendait le corps en texte brut : les adresses des deux journaux n'étaient pas cliquables.

## Livré et fonctionnel

- [x] **Seconde illustration** (`app/(public)/s-informer/media/[slug]/page.tsx`, fonction `imageIllustration`) : quand `media_url` pointe vers une image JPEG, PNG ou WebP du bucket public `media` de notre Supabase, l'article l'affiche sous son texte. Seul notre propre stockage est accepté. Aucune migration : le jeton d'administration Supabase (`SUPABASE_ACCESS_TOKEN`) répond 401, une nouvelle colonne n'était pas possible.
- [x] **Adresses cliquables dans le corps** (composant `CorpsAvecLiens`) : le texte reste du texte brut, seules les adresses http(s) deviennent des liens (nouvel onglet, `noopener noreferrer`). Une ponctuation collée à la fin reste hors du lien. Profite aussi aux articles plus anciens qui citaient une adresse en fin de texte.
- [x] **Article publié en base de production** (feu vert explicite de Lilou/Ben) : slug `fin-du-monde-fin-du-mois-le-17-octobre-nous-serons-la`, type `tribune`, images dans `media/tribunes/`, tags Luttes et mobilisations, Écologie, Social et travail. Texte repris mot pour mot de la version publiée par Regards.
- [x] Déployé et vérifié en ligne (version Worker 1c4e6136) : page 200, deux images servies, deux liens cliquables.

## Contenus à arbitrer

- [ ] L'article est signé « Rédaction » (pas d'`auteurice_id`) : la tribune est signée par dix membres de la coordination, listés dans le texte. À rattacher à une personne si Lilou/Ben le souhaite.

## Tests

- Typecheck vert, Biome vert sur le fichier modifié.
- Suite complète et Playwright non relancées pour ce correctif d'affichage.

## Notes pour les chantiers suivants

- Le crédit des images est écrit en fin de texte, faute de champ dédié. Un vrai champ légende demandera une migration, donc un jeton d'administration Supabase renouvelé.
