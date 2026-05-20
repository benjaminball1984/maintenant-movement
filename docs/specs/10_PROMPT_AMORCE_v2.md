# Prompt d'amorce v2 — Claude Code pour Maintenant!

**Usage** : à coller dans toute session Claude Code lancée depuis le dépôt `maintenant/`. Le `CLAUDE.md` à la racine contient le reste (mémoire persistante, persona, règles, état du projet).

---

## ▼ PROMPT À COLLER À CHAQUE DÉMARRAGE ▼

```
Salut Claude Code,

On reprend (ou on démarre) le projet Maintenant!.

ÉTAPE 1 — LECTURE OBLIGATOIRE

Lis intégralement, dans cet ordre, sans skip :
  1. CLAUDE.md (à la racine du dépôt) — c'est ta mémoire persistante
  2. docs/specs/01_ARCHITECTURE.md
  3. docs/specs/08_PLAN_CHANTIERS.md (pour savoir où on en est)
  4. Le dernier MANIFEST dans docs/manifests/ s'il existe

Les autres fichiers de docs/specs/ se consultent quand le chantier en cours
en a besoin. Tu n'as pas besoin de tout lire à chaque session.

ÉTAPE 2 — VÉRIFICATION DE COMPRÉHENSION

Résume-moi en 5 à 10 lignes :
  - L'état actuel du projet (quel chantier vient de se terminer, lequel
    est en cours, ce qui est en attente)
  - Ta compréhension de la règle d'or de non-invention (CLAUDE.md §3)
  - Ta compréhension de l'exigence d'exhaustivité (CLAUDE.md §4)

ÉTAPE 3 — QUESTIONS D'ENTRÉE

Pose-moi 1 à 5 questions précises uniquement si tu as une incertitude
réelle (politique, technique, ou données externes manquantes). Pas de
questions de courtoisie ni de questions dont la réponse est dans
CLAUDE.md ou docs/specs/. Si tu n'as pas de question, dis-le.

ÉTAPE 4 — PROPOSITION DE PLAN

Avant de toucher au moindre fichier :
  1. Annonce le chantier que tu attaques (numéro, titre, branche à créer).
  2. Liste les étapes en 5 à 10 points (mode plan Claude Code si disponible).
  3. Attends ma validation explicite. Je dirai « ok » ou je corrigerai.

ÉTAPE 5 — EXÉCUTION

Une fois validé :
  - Tu crées la branche feature/phase-N-chantier-N.X-description-courte
  - Tu travailles le chantier de bout en bout
  - Tu suis la checklist d'exhaustivité de CLAUDE.md §4 avant de te déclarer
    terminé·e (clic sur chaque bouton, soumission de chaque formulaire,
    navigation de chaque lien, états gérés, tests E2E verts)
  - Tu produis le MANIFEST.md du chantier (CLAUDE.md §5)
  - Tu commits avec message conventionnel
  - Tu mets à jour la section 11 de CLAUDE.md (état courant du projet)
  - Tu me préviens, tu attends ma relecture du MANIFEST avant d'aller plus loin

ÉTAPE 6 — GESTION DU CONTEXTE

Si la session approche 60-70 % de la fenêtre de contexte, utilise /compact.
Si une tâche est répétitive et longue (créer N composants similaires,
importer un gros CSV, écrire une série de tests), lance un subagent dédié.

ÉTAPE 7 — RÈGLES PERMANENTES

Rappel des règles non négociables (le reste est dans CLAUDE.md) :

  - Tu n'inventes RIEN de politique, éditorial, ou architectural. Pour les
    trous de contenu, tu mets un placeholder visible et tu listes dans
    le MANIFEST sous « Contenus à arbitrer ». (CLAUDE.md §3)
  - Tu ne livres RIEN de partiel sans le déclarer explicitement. Boutons
    sans action, étoiles non-fonctionnelles, formulaires sans validation,
    onglets vides : refus catégorique. (CLAUDE.md §4)
  - Tu utilises les mocks par défaut pour Brevo, Stripe, LiveKit, T99CP.
    Le site marche à 100 % en local sans aucune API connectée. (CLAUDE.md §6)
  - Pas de tiret cadratin (—) nulle part. Inclusivité variée. Vocabulaire
    fixé non négociable (Décider, Cosec gé, Empouvoirement, 99-coin, etc.).
    (CLAUDE.md §9 et §10)

Vas-y, commence par l'étape 1.
```

## ▲ FIN DU PROMPT ▲

---

## Notes pour Lilou/Ben

### Pour la toute première session

Avant la première session, dépose dans le dépôt :

1. `CLAUDE.md` à la racine (renommé depuis `docs/specs/09_CLAUDE.md`).
2. Le pack complet dans `docs/specs/` (les 9 fichiers numérotés + arborescence.mermaid).
3. Un `.gitignore` Node de base (Claude Code en créera un complet en chantier 0.1).

### Pour les sessions de reprise

Tu colles ce même prompt. Claude Code lit le CLAUDE.md (qui aura été mis à jour à la fin du chantier précédent par Claude Code lui-même), il sait exactement où on en est, et il reprend.

### Si la session précédente s'est mal terminée

Tu peux ajouter au prompt : « Le chantier N.X s'est mal terminé, [raison brève]. Lis le dernier MANIFEST et le dernier commit, propose un plan de récupération avant d'avancer. »

### Si tu veux orienter sur un chantier différent du plan

Tu peux ajouter au prompt : « Au lieu du chantier suivant prévu, on attaque le chantier N.Y parce que [raison]. »

### Si tu détectes que Claude Code dérive

Sors la règle d'or :
- « Stop. Tu inventes du contenu. Mets des placeholders à la place et liste dans le MANIFEST. »
- « Stop. Cette page a un lien vers une page qui n'existe pas. Tu déclares le chantier terminé alors qu'il ne l'est pas. Reprends la checklist d'exhaustivité. »
- « Stop. Tu as ajouté une fonctionnalité qui n'est pas dans les specs. Retire-la, signale dans le MANIFEST sous « propositions ». »

### Coût estimé

Pour un site de cette ampleur, en mode Claude Code (Opus 4.7) :
- Chantier 0 (fondations) : ~1 à 2 € en API.
- Chaque chantier feature (espace ou gros module) : ~5 à 15 €.
- Total du plan complet (12 phases, ~30 chantiers) : estimation 80 à 200 €.

Compter 1,5× à 2× si beaucoup d'itérations sont nécessaires (mais le setup CLAUDE.md + tests E2E + MANIFEST devrait drastiquement réduire ce facteur).

À budgéter dans le plan de financement Maintenant!, ligne « infrastructure technique ».
