# Manifest — Chantier V2.5.3 : Master Plan V2.6 Phase B (identité visuelle, dégradé)

**Date de fin** : 2026-05-29 (nuit du 29 au 30)
**Branche** : `main`
**Commit final** : (à renseigner après commit)
**Durée approximative** : ~10 min (audit + petit ajustement footer).

## Constat préalable

Le système d'identité visuelle dégradée est **déjà en place et bien diffusé** dans le code. Le Master Plan §B disait « le problème n'est pas qu'il manque, c'est qu'il n'est pas assez présent ». L'audit montre que c'est plus présent qu'il n'y paraissait :

- **Token CSS `--grad`** défini dans `styles/tokens.css` lignes 53-56 (clair) et 156-160 (sombre) avec adaptation contraste. Valeurs conformes au Master Plan : `#7C3AED → #E11D74 → #DC2654` en clair.
- **Classe Tailwind `bg-grad`** définie dans `tailwind.config.ts` ligne 70.
- **Composant `Button`** (`components/ui/Button.tsx`) : variante `primary` (alias `gradient`) qui applique `bg-grad text-white shadow-brand hover:brightness-110`. C'est le défaut.
- **Audit grep** : 49 fichiers utilisent déjà `bg-grad` ou `variant="primary/gradient"`, sur 81 fichiers qui utilisent `<Button>`. Ratio ~60 %, cohérent avec la doctrine « primary uniquement pour les CTA majeurs, secondaires en ghost/outline ».
- **Page d'accueil** : titre principal en gradient text (`bg-grad bg-clip-text text-transparent`), CTA de signature pétition en `bg-grad shadow-brand`. Conforme.
- **Tous les `Une*`** (UnePetition, UneArticle, UneMobilisation, UneCagnotte) : CTA principal en dégradé.

## Livré

- [x] **Wordmark dégradé dans le footer** : le mot « Maintenant! » dans la première colonne du footer passe en `bg-grad bg-clip-text text-transparent` (au lieu de `text-text-1` plat). Plus identifiant visuellement.
- [x] **Emplacement explicite pour le logo officiel** : commentaire structuré dans `components/layout/Footer.tsx` qui indique précisément où coller le SVG/PNG du logo poing levé + coquelicot quand Lilou/Ben le fournira (`public/logo/maintenant.svg`, ajustement du JSX commenté).

## Non livré (et pourquoi)

- [ ] **Logo poing levé + coquelicot** : aucun fichier source disponible. La règle de non-invention (§3 du CLAUDE.md) interdit d'inventer une identité visuelle. Le wordmark dégradé tient le rôle visuel temporaire. Au matin, Lilou/Ben pourra coller le vrai logo dans `public/logo/` et remplacer le wordmark par `<Image>`.
- [ ] **Audit exhaustif et correction des 32 fichiers Button restants** : la plupart sont des actions secondaires (annuler, retour, voir tout) qui doivent rester en ghost/outline pour respecter la règle d'or anti-saturation documentée dans `Button.tsx` ligne 13-15. Pas de correction utile sans risque de saturation.

## Décisions techniques

- **Pas de fichier logo créé** : strictement conforme à la règle de non-invention §3 du CLAUDE.md (« Palette, typographie, iconographie, identité visuelle au-delà de ce que pose 04_DESIGN-TOKENS.md »).
- **Wordmark gradient au lieu de logo réel** : solution honnête et identifiable. Maintient l'identité visuelle sans rien inventer.

## Tests

- **918 tests verts** (inchangé).
- **Typecheck** global vert.
- **Lint** propre (modification mineure d'un seul fichier).

## Notes pour les chantiers suivants

- Quand Lilou/Ben fournit le logo : coller le fichier dans `public/logo/maintenant.svg` (ou `.png`), puis remplacer dans `Footer.tsx` le bloc `<p className="bg-grad bg-clip-text...">` par `<Image src="/logo/maintenant.svg" alt={SITE.nom} width={140} height={40} priority />`.
- Si jamais une page paraît visuellement austère lors du test au matin, identifier laquelle et la corriger ciblément (Phase B « touche plus chaleureuse aux espaces les plus austères ») plutôt que de faire une passe globale qui risque de saturer.
