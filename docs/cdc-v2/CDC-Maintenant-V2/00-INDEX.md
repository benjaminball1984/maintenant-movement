# INDEX — Cahier des charges V2 du site Maintenant!

> **Fichier racine** : 00-INDEX.md
> **Dernière mise à jour** : 2026-05-26 (soir)
> Point d'entrée de tout le pack de spécifications V2. À LIRE EN PREMIER.
> Repo : github.com/benjaminball1984/maintenant-movement
> Signature : LIFE BENJAMIN BALL.

---

## Comment lire ce pack

1. **Commencer par `principes-transversaux-V2.md`** (v3.2) — c'est le document chapeau. Tous les sous-espaces en dépendent. Claude Code DOIT le lire en premier.
2. **Puis les deux documents de synthèse transversaux** : `schema-donnees-V2.md` (le modèle de données, 13 décisions D1-D13) et `matrice-droits-V2.md` (les droits de plateforme, MD0-MD6). Ils ordonnent tout le reste.
3. Puis les fiches de sous-espace, regroupées par espace.

## Avancement de la revue (au 2026-05-26)

| Espace | Sous-espace | Fichier | État |
|---|---|---|---|
| (transversal) | Principes | principes-transversaux-V2.md (v3.2) | ✅ |
| (transversal) | Schéma de données | schema-donnees-V2.md (v1.0) | ✅ |
| (transversal) | Matrice de droits | matrice-droits-V2.md (v1.0) | ✅ |
| (transversal) | Profils d'organisation | organisations-V2.md (v1.0) | ✅ |
| Mobiliser | Pétitions | petitions-V2.md (v1.1) | ✅ |
| Mobiliser | Mobilisations | mobilisations-V2.md (v1.0) | ✅ |
| Mobiliser | Campagnes | campagnes-V2.md (v1.0) | ✅ |
| Mobiliser | Cagnottes | cagnottes-V2.md (v1.0) | ✅ |
| S'informer | Décider | decider-V2.md (v2.0) | ✅ |
| S'informer | Maintenant Médias (+ radio + affiche) | maintenant-medias-V2.md (v1.1) | ✅ |
| S'informer | Sondages | sondages-V2.md (v1.0) | ✅ |
| S'informer | Réseau social (7.5) | reseau-social-V2.md (v1.0) | ✅ |
| S'entraider | Hébergement | hebergement-V2.md (v1.0) | ✅ |
| S'entraider | Transport / covoiturage | transport-V2.md (v1.0) | ✅ |
| S'entraider | Prêt (« qui prête tout ») | pret-V2.md (v1.0) | ✅ |
| S'entraider | SEL | sel-V2.md (v1.0) | ✅ |
| S'entraider | Fruits de la terre | fruits-de-la-terre-V2.md (v1.0) | ✅ |
| S'entraider | Marché solidaire | marche-solidaire-V2.md (v1.0) | ✅ |
| S'entraider | Groupe d'entraide local | groupe-entraide-local-V2.md (v1.0) | ✅ |
| Agir | Adhérer | 04-Agir/adherer-V2.md (v1.0) | ✅ |
| Agir | Commune libre | 04-Agir/commune-libre-V2.md (v1.0) | ✅ |
| Agir | Moments solidaires | 04-Agir/moments-solidaires-V2.md (v1.0) | ✅ |
| Agir | Autres moyens d'agir | 04-Agir/autres-moyens-agir-V2.md (v1.0) | ✅ |

## Reste à faire (prochaines sessions)

- **S'informer et Agir : ENTIÈREMENT BOUCLÉS.** Restent : Espace membre, Admin/modération, Transverses, Fondations.
- **Espace membre / profil** : dashboard, infos, confidentialité, contributions, wallet, notifications.
- **Admin / modération** : consoles, droits, équipes de modération.
- **Transverses** : carte unifiée, agenda, notifications.
- **Fondations** : CMS d'édition (texte + images partout), crons/automatisations, délivrabilité (SPF/DKIM/DMARC), déploiement Cloudflare + DNS Ionos.

Méthode validée : une dizaine de questions ou plus PAR sous-espace, une question à la fois, fichier .md par sous-espace, INDEX qui agrège. Puis plan d'implémentation, puis revue de code + prompt Claude Code.

## Trois livrables finaux attendus (objectif global de Lilou)

1. Questions d'arbitrage + clés/textes à fournir (en cours, intégré dans les fiches).
2. Revue de code (alertes, état).
3. Cahier des charges V2 + prompt pour que Claude Code rende la V2 fonctionnelle de bout en bout.

