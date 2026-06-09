# Manifest — Phase V2.6, Chantier V2.6.80 : propagation du fix captcha aux formulaires

**Date de fin** : 2026-06-09
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare
**Commit final** : (voir git log, message « phase V2.6 - chantier V2.6.80 - ... »)
**Durée approximative** : 1 session Claude Code

## Contexte

Le correctif d'UX du captcha (le bouton de soumission reste désactivé tant que la
vérification anti-robot Cloudflare Turnstile n'a pas fourni son jeton, plus un court
message d'attente) avait été posé en V2.6.76/77 sur le seul formulaire de connexion
par mot de passe. Avant, sur tous les autres formulaires, le bouton était cliquable
trop tôt et la soumission échouait silencieusement (jeton vide rejeté côté serveur).

Ce chantier propage le pattern de référence (`FormulaireConnexionMdp.tsx`) aux
**29 formulaires restants** qui affichent `<CaptchaTurnstile>`.

## Livré et fonctionnel

- [x] Les 29 formulaires reçoivent le pattern complet :
  - état `hydrate` (`useState(false)` + `useEffect` qui le passe à `true` au montage),
    pour éviter toute désynchronisation d'hydratation (le bouton part désactivé côté
    serveur comme côté client) ;
  - drapeau `captchaValide` dérivé du jeton :
    - formulaires react-hook-form : `(watch('token_turnstile') ?? '') !== ''`
      (ajout de `watch` à la déstructuration de `useForm` là où il manquait) ;
    - composants à `useState` local (boutons « Je participe », « Rejoindre »,
      composeur réseau) : `token !== ''` ;
  - message d'attente `aria-live="polite"` affiché tant que `hydrate && !captchaValide`,
    inséré juste après `<CaptchaTurnstile>` ;
  - `|| !hydrate || !captchaValide` ajouté au `disabled` du bouton de soumission.
- [x] Texte du message **éditable** (directive §0bis.8) : clé CMS
  `messageCaptchaEnAttente?: string` ajoutée à l'interface `Libelles*` + valeur dans
  `LIBELLES_DEFAUT` pour les formulaires qui suivent ce pattern ; constante de module
  `MESSAGE_CAPTCHA_EN_ATTENTE` pour les 3 composants sans pattern libellés
  (`BoutonParticiper`, `BoutonParticiperMoment`, `BoutonRejoindreCommune`, `ComposerPost`).
- [x] Les boutons « Annuler »/« Fermer »/« Quitter » et les boutons déjà désactivés
  pour une autre raison (« Tu participes ✓ ») NE sont PAS gatés par le captcha.

### Liste des 29 formulaires traités

adhesion/FormulaireAdhesionEuros · adhesion/FormulaireAdhesionGratuit ·
adhesion/FormulaireAdhesionT99CP · cagnottes/FormulaireDonEuros ·
cagnottes/FormulaireDonT99CP · cagnottes/FormulaireCreationCagnotte ·
campagnes/FormulaireCreationCampagne · communes/BoutonRejoindreCommune ·
communes/FormulaireCreationCommuneLibre · communes/FormulaireCreationFederation ·
entraide/FormulaireCreationOffre · marche/FormulaireAchat ·
marche/FormulaireCreationBoutique · marche/FormulaireCreationMinimarche ·
marche/FormulaireCreationProduit · marche/FormulaireNotation ·
mobilisations/BoutonParticiper · mobilisations/FormulaireCreationMobilisation ·
modales/ModaleSignaturePetition · moments/BoutonParticiperMoment ·
moments/FormulaireCreationMoment · petitions/FormulaireCreationPetition ·
reseau/ComposerPost · sel/FormulaireCreationService ·
sondages/FormulaireCreationSondage · sondages/FormulaireVote ·
(auth)/FormulaireDemandeReset · (auth)/FormulaireMagicLink · (auth)/FormulaireInscription

## Non livré (et pourquoi)

- Rien dans le périmètre. Le formulaire de connexion (`FormulaireConnexionMdp`) avait
  déjà le pattern (référence, V2.6.76/77), non retouché.

## Contenus à arbitrer

- Aucun. Le message d'attente reprend mot pour mot celui de la connexion (déjà validé).

## Tests

- Unitaires Vitest : **1030 tests verts** (90 fichiers), inchangé (le correctif est
  purement de l'UI cliente, hors logique testée).
- Typecheck (`tsc --noEmit`) : vert.
- Lint (`biome check .`) : aucune nouvelle alerte sur les 29 fichiers (18 warnings
  préexistants + 1 erreur préexistante dans `scripts/convertir-tout-en-riche.ts`,
  hors périmètre, non touchée).
- Build (`next build`) : succès.
- Contrôle de cohérence (grep) : les 30 fichiers (29 + référence) ont `captchaValide`
  exactement 3 fois et la chaîne du message exactement 1 fois (aucun risque de message
  vide faute de valeur par défaut).

## Notes pour les chantiers suivants

- Les 3-4 composants sans pattern libellés (`BoutonParticiper`, `BoutonParticiperMoment`,
  `BoutonRejoindreCommune`, `ComposerPost`) utilisent une constante de module pour le
  message d'attente : candidats à une CMS-isation complète si on généralise les libellés
  éditables à ces composants plus tard.
