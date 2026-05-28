# Manifest — Chantier V2.5.6 : Master Plan V2.6 Phase E (tunnel pétition → adhésion → commune)

**Date de fin** : 2026-05-30 (nuit du 29 au 30)
**Branche** : `main`
**Commit final** : (à renseigner après commit)
**Durée approximative** : ~15 min (intervention chirurgicale).

## Constat préalable

Le tunnel pétition → adhésion → commune décrit par le Master Plan §3.3 et §E est partiellement déjà en place :

- **Pétitions** : table, page liste, page détail, modale de signature (`components/modales/ModaleSignaturePetition.tsx`) avec validation Zod et Turnstile. ✓
- **Adhésion** : pages `/agir/adherer`, `/agir/adherer/gratuit`, `/agir/adherer/euros`, `/agir/adherer/t99cp`, `/agir/adherer/retour`. ✓
- **Communes** : page liste `/agir/communes`, page détail `/agir/communes/[slug]`, bouton Rejoindre/Quitter. ✓

**Ce qui manquait** : le **chaînage** entre ces 3 espaces. Après signature de la pétition, l'écran de remerciement disait juste « Ton signal est enregistré. Pas de partage à demander : c'est déjà fort » et offrait juste un bouton « Fermer ». Aucune passerelle vers la marche suivante.

## Livré

- [x] **Tunnel intégré dans l'écran de merci de la modale** : après signature, l'utilisateur voit toujours le message de remerciement, ET un encart « Aller plus loin avec Maintenant! » qui propose 2 CTA visibles :
  - **Devenir adhérent·e** → `/agir/adherer` (bouton primary, dégradé identitaire)
  - **Rejoindre une commune libre** → `/agir/communes` (bouton outline brand)
- [x] **Pas de pression** : l'encart est visuellement distinct (carte gris-violet `bg-surface-2`), avec un titre, une intro courte, puis les 2 CTA. Le bouton « Fermer » reste accessible en bas. La personne peut choisir une marche suivante OU simplement refermer.
- [x] **Tout éditable via CMS** : 4 nouvelles clés ajoutées à `LibellesSignaturePetition` (`tunnelTitre`, `tunnelIntro`, `tunnelCtaAdherer`, `tunnelCtaCommune`). Lilou/Ben pourra modifier le ton et les libellés sans toucher au code.
- [x] **Message de remerciement assoupli** : passe de « Pas de partage à demander : c'est déjà fort » (qui ferme la porte) à « Tu vas recevoir un email pour confirmer » (qui annonce la suite logique du tunnel : vérification email).
- [x] **932 tests verts** (inchangé), typecheck vert, lint propre.

## Non livré (et pourquoi)

- [ ] **Email de confirmation enrichi** avec lien vers l'adhésion : nécessite de modifier le contenu du mail envoyé par `signerPetition` Server Action ET la couche email (qui est probablement en mock pour l'instant). À faire en Phase L (« emails soignés par défaut ») ou avant si Lilou/Ben le valide.
- [ ] **Page de confirmation post-signature avec formulaire d'adhésion pré-rempli** : c'est la pièce maîtresse de la Phase E selon le Master Plan §E (« la page de confirmation qui propose l'adhésion avec formulaire pré-rempli »). Pour la faire proprement, il faut :
  - Une page `/agir/petitions/[slug]/merci` qui prend les query params `?prenom=X&email=Y&cp=Z`
  - Modifier la modale pour rediriger vers cette page au lieu de juste afficher le merci inline
  - Pré-remplir le formulaire d'adhésion via query params
  C'est un chantier de **30 min à 1h** que je laisse en attente pour ne pas casser le flow nocturne. **À programmer en V2.5.6.a.**
- [ ] **Page « retrouver des gens près de chez moi »** avec ses 4 blocs (commune du CP, sous-préfecture, préfecture, autre) : pareil, mérite son chantier dédié.
- [ ] **Rejoignement de commune en un clic** depuis la page « gens près de chez moi » : la mécanique `rejoindreCommune` existe, reste à faire l'UI dédiée.

## Décisions techniques

- **Modification minimale et non-régressive** : le contrat de la modale est inchangé (même Server Action, même props, même Zod schema). Seul l'écran de merci visuel est enrichi. Aucun appelant n'est cassé.
- **Pas de query string complexe pour pré-remplir l'adhésion** : pour ne pas introduire de risque XSS via la prop `prenom` côté URL. Quand on fera la vraie page de confirmation, on utilisera une session courte ou un token éphémère.
- **CTA en HTML `<a>` au lieu de `<Link>` Next.js** : c'est plus simple ici (composant client en use client) et c'est de la navigation cross-routes qui bénéficie de toute façon d'un full page load (pour exécuter les Server Components de la page cible).

## Tests

- **932 tests verts** (inchangé).
- **Typecheck** vert.
- **Lint** propre.

## Notes pour les chantiers suivants

- **V2.5.6.a** : la vraie page de confirmation post-signature avec formulaire d'adhésion pré-rempli (~1h).
- **V2.5.6.b** : page « gens près de chez moi » (~1h).
- **Phase F (V2.5.7)** : moteur d'invitation virale, à faire dans la foulée pour boucler la chaîne signature → adhésion → commune → invitation. C'est là que le tunnel devient vraiment puissant.
