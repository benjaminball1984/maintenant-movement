# Proposition — sources « autres fuseaux horaires » pour combler la nuit

**Date** : 2026-06-15
**Demande Ben** : « on cherche d'autres sources francophones, anglophones ou
hispanophones qui publient sur d'autres fuseaux horaires » + « n'oublie pas les
québécois, il doit y en avoir des biens ».

## Pourquoi

La règle de fraîcheur « moins de 2 h » (V2.6.121) ne prend que les contenus
publiés dans les 2 dernières heures. Or ~90 % des sources actuelles sont en
fuseau européen (UTC+1/+2) : la nuit parisienne (minuit → 7h), personne ne
publie, donc l'import ne trouve rien et le fil semble figé. La solution : des
médias engagés qui, à ce moment-là, sont en plein après-midi/soirée chez eux
(Amériques), donc publient pendant notre nuit.

Toutes les URL ci-dessous ont été **testées le 2026-06-15** : flux vivant +
heure de Paris réelle des derniers articles (preuve de couverture nuit).
Scripts : `data-migration/verifier-sources-fuseaux.mjs` et `verif-quebec.mjs`.

Légende : 🌙 = publie en pleine nuit Paris (00h-06h, confirmé) ·
🌆 = couvre la soirée Paris (18h-00h) · ⭐ = couverture nuit particulièrement nette.

---

## FRANCOPHONES (Québec, Canada, Haïti)

| Marqueur | Source | Ligne éditoriale | Flux |
|---|---|---|---|
| 🌙 | **Le Devoir** (Québec) | quotidien de référence, progressiste | `https://www.ledevoir.com/rss/section/politique.xml` |
| 🌙 | **Ricochet** (Québec) | indépendant, de gauche | `https://ricochet.media/feed` |
| 🌙⭐ | **Radio-Canada Info** | service public, généraliste (mainstream) | `https://ici.radio-canada.ca/rss/4159` |
| 🌙⭐ | **AlterPresse** (Haïti) | agence indépendante, droits humains | `https://www.alterpresse.org/spip.php?page=backend` |
| 🌆 | **Pivot** (Québec) | indépendant, écolo/social | `https://pivot.quebec/feed/` |
| (jour) | **Presse-toi à gauche !** (Québec) | anticapitaliste (basse fréquence) | `https://www.pressegauche.org/spip.php?page=backend` |
| 🌆 | **La Presse** (Québec) | grand quotidien, centriste-libéral (volume) | `https://www.lapresse.ca/actualites/rss` |

## ANGLOPHONES (États-Unis, Canada)

| Marqueur | Source | Ligne éditoriale | Flux |
|---|---|---|---|
| 🌙 | **Truthout** (US) | gauche, justice sociale | `https://truthout.org/latest/feed/` |
| 🌙 | **Common Dreams** (US) | progressiste, écolo | `https://www.commondreams.org/feeds/news.rss` |
| 🌙 | **Mother Jones** (US) | investigation, gauche | `https://www.motherjones.com/feed/` |
| 🌙 | **Inside Climate News** (US) | écologie, Pulitzer | `https://insideclimatenews.org/feed/` |
| 🌙 | **The Tyee** (Canada, C.-B.) | indépendant, de gauche | `https://thetyee.ca/rss2.xml` |
| 🌙 | **National Observer** (Canada) | climat, investigation | `https://www.nationalobserver.com/front/rss` |
| 🌙 | **Jacobin** (US) | socialiste | `https://jacobin.com/feed/` |
| 🌆 | **The Real News Network** (US) | vidéo, mouvements sociaux | `https://therealnews.com/feed` |
| 🌆 | **The Breach** (Canada) | indépendant, de gauche | `https://breachmedia.ca/feed/` |
| 🌆 | **rabble.ca** (Canada) | progressiste, syndical | `https://rabble.ca/feed/` |
| 🌆 | **The Maple** (Canada) | gauche, abonnement | `https://www.readthemaple.com/rss/` |
| 🌆 | **Labor Notes** (US) | syndical | `https://labornotes.org/feed` |
| 🌆 | **The Intercept** (US) | investigation | `https://theintercept.com/feed/?rss` |
| 🌆 | **The Nation** (US) | gauche, historique | `https://www.thenation.com/feed/?post_type=article` |
| 🌆 | **ProPublica** (US) | investigation à but non lucratif | `https://www.propublica.org/feeds/propublica/main` |
| 🌆 | **Grist** (US) | écologie/climat | `https://grist.org/feed/` |
| 🌆 | **Democracy Now!** (US) | édition quotidienne, indépendant | `https://www.democracynow.org/democracynow.rss` |

## HISPANOPHONES — Amérique latine (couvrent la nuit Paris)

| Marqueur | Source | Ligne éditoriale | Flux |
|---|---|---|---|
| 🌙⭐ | **El Ciudadano** (Chili) | gauche, indépendant | `https://www.elciudadano.com/feed/` |
| 🌙⭐ | **La Izquierda Diario** (Argentine) | gauche révolutionnaire | `https://www.laizquierdadiario.com/spip.php?page=backend_portada` |
| 🌙 | **Resumen Latinoamericano** | anti-impérialiste, luttes | `https://www.resumenlatinoamericano.org/feed/` |
| (édition) | **La Jornada** (Mexique) | grand quotidien de gauche | `https://www.jornada.com.mx/rss/edicion.xml` |

## HISPANOPHONES — Espagne (PAS la nuit, mais engagés — bonus de volume)

| Source | Ligne éditoriale | Flux |
|---|---|---|
| **El Salto** | quotidien militant, coopératif | `https://www.elsaltodiario.com/general/feed` |
| **Pikara Magazine** | féministe | `https://www.pikaramagazine.com/feed/` |
| **Sin Permiso** | analyse de gauche | `https://www.sinpermiso.info/rss.xml` |

---

## Écartées (testées, inexploitables au 2026-06-15)

- **Página/12** (Argentine) : tous les flux RSS répondent 404 (le journal
  semble avoir retiré ses flux publics).
- **El Desconcierto** (Chili), **Desinformémonos** (Mexique), **CTXT** (Espagne) :
  protégés (Cloudflare) ou rendus en JavaScript, pas de flux lisible.
- **Canadian Dimension**, **L'aut'journal** (Québec) : flux 404.
- **Brecha** (Uruguay, hebdo), **À bâbord !** / **Relations** (Québec, revues
  trimestrielles) : trop basse fréquence pour un fil horaire.
- **The American Prospect** : HTTP 429 (limite de débit) au test, à re-vérifier.

## Caveat technique pour le câblage (à régler en même temps)

Ajouter ces sources ne suffit pas : l'import horaire tire ~4 sources au hasard
puis abandonne. La nuit, il faut qu'il **atteigne** réellement une source des
Amériques. Donc, au câblage :
1. classer les couvreuses de nuit en `prioritaire` (plus de chances d'être tirées) ;
2. relever un peu le nombre de sources essayées avant d'abandonner ;
3. option plus fine : biais selon l'heure (la nuit Paris → tirer d'abord les Amériques).

Décision technique que je prends au câblage une fois la liste validée.
