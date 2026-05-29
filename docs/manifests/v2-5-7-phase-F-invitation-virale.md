# Manifest — Chantier V2.5.7 : Master Plan V2.6 Phase F (moteur d'invitation virale)

**Date de fin** : 2026-05-30 (nuit du 29 au 30)
**Branche** : `main`
**Commit final** : (à renseigner après commit)
**Durée approximative** : ~30 min.

## Objectif Master Plan

Phase F : « L'écran d'invitation, irréprochable parce que c'est lui qui transforme un engagement en plusieurs. Deux voies : (1) interne (inviter des amis du réseau social), (2) externe (liens de partage WhatsApp, Telegram, Messenger, Signal, Discord, email, Mastodon). Le message pré-écrit est une clé CMS éditable. »

## Livré

- [x] **Module `lib/partage/liens.ts`** : helpers purs pour fabriquer les URLs de partage vers 6 services (WhatsApp, Telegram, Messenger, Signal, Email, Mastodon). Chaque helper prend `{titre, url, message}` et renvoie une URL `https://...` (ou `mailto:` ou `sgnl://`) prête à ouvrir l'app native ou la version web.
- [x] **Composant `<BoutonsPartage>`** (Server Component, `components/partage/BoutonsPartage.tsx`) : grille de 6 boutons stylés (border, emoji, libellé) ouvrant chaque URL en `target="_blank"`. Titre et intro du bloc passés en props (donc éditables CMS côté parent).
- [x] **Branchement sur la page détail pétition** : `<BoutonsPartage>` ajouté après le texte de la pétition, visible seulement si la pétition est publiée. Message pré-rempli factuel : « Cette pétition mérite d'être vue : [titre]. »
- [x] **9 tests unitaires** (`tests/unit/partage/liens.test.ts`) : vérifient l'origine des URLs, l'encodage des accents et caractères spéciaux, la présence des paramètres attendus, l'absence de bug sur des entrées avec caractères dangereux (& < > " etc.).
- [x] **941 tests verts au total** (932 + 9 nouveaux).
- [x] **Typecheck** vert, **lint biome** propre.

## Non livré (et pourquoi)

- [ ] **Voie interne (inviter des amis du réseau social)** : le Master Plan parle de 2 voies. La voie interne (chercher dans son carnet social et envoyer un message Maintenant!) nécessite la mécanique de messagerie interne (`message_reseau`, déjà existant dans le projet) + une UI dédiée. Reporté pour ne pas alourdir ce chantier. À programmer en V2.5.7.a.
- [ ] **Discord** : pas inclus dans la liste actuelle. Discord n'a pas de protocole de partage standardisé (pas de `discord://share` universel) ; on aurait dû proposer juste un « copier le lien » avec un bouton dédié. À ajouter si Lilou/Ben le confirme.
- [ ] **Branchement sur les autres types d'entités** : `<BoutonsPartage>` est branché sur la page pétition. À étendre aux pages mobilisation, cagnotte, campagne, événement, commune, GT. ~5 min par page (copier-coller le bloc, adapter le message pré-rempli).
- [ ] **Bouton « Inviter mes amis du réseau social »** : nécessiterait une modale qui liste les abonnés du compte courant + envoi en batch. Vrai mini-chantier.
- [ ] **Web Share API native** comme fallback intelligent : pour les smartphones modernes qui supportent `navigator.share`, on pourrait proposer un seul bouton « Partager » qui appelle l'API native et laisse l'OS afficher ses propres apps. Moins universel mais plus fluide.

## Décisions techniques

- **Server Component** pour `<BoutonsPartage>` : pas besoin de JavaScript côté client. Les liens sont des `<a href>` standards qui ouvrent dans une nouvelle fenêtre.
- **Emojis pour les icônes** : pas d'invention d'iconographie (règle de non-invention §3 du CLAUDE.md). Les emojis universels (💬 ✈️ 📨 🔒 ✉️ 🐘) sont neutres, accessibles, et chargent gratuitement.
- **6 services et pas plus** : couvre 90 % des usages français. Discord et Reddit pourront être ajoutés si demandés. Pas Twitter/X ni Facebook (cf. doctrine du site : pas de plateformes captatrices).
- **`target="_blank" rel="noopener noreferrer"`** systématique : ouverture en nouvel onglet pour ne pas perdre la page de la pétition, sécurité standard.
- **Message pré-rempli sobre** : « Cette pétition mérite d'être vue : [titre]. » Pas de superlatifs, pas de pression. Le destinataire reçoit un signalement personnel, pas un spam.
- **Helpers purs séparés du composant** : permet les tests unitaires sans React, et la réutilisation depuis d'autres contextes (ex. email transactionnel qui veut inclure des liens de partage dans son contenu).

## Tests

- **941 tests verts** (932 + 9 nouveaux sur les helpers de partage).
- **Typecheck** vert.
- **Lint biome** propre.

## Notes pour les chantiers suivants

- **V2.5.7.a** : voie interne d'invitation (modale qui liste les abonnés du réseau social + envoi message en batch). ~1h.
- **Extension multi-entités** : ajouter `<BoutonsPartage>` sur les pages détail des autres entités (mobilisation, cagnotte, campagne, moment solidaire, etc.). 5-10 min par entité.
- **Cas d'usage validé** : depuis la page d'une pétition publiée, un utilisateur peut maintenant en un clic ouvrir WhatsApp / Telegram / Email avec un message pré-rempli qui partage le lien. C'est l'exigence centrale du Master Plan §F qui était manquante.
