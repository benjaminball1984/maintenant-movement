# app/auth

Cette route **NE vit PAS** dans le route group `app/(auth)/` à dessein.

## Pourquoi cette coexistence avec `app/(auth)/` ?

Dans Next.js App Router, les parenthèses définissent un **route group** : elles regroupent des routes pour partager un layout sans projeter leur nom dans l'URL. Donc :

- `app/(auth)/connexion/page.tsx` → URL : `/connexion`.
- `app/auth/callback/route.ts` → URL : `/auth/callback`.

Le **callback OAuth/Magic Link de Supabase** doit pointer vers une URL **stable et préfixée par `/auth/`** parce que :

1. C'est la convention publiquement attendue par les SDK Supabase et par la majorité des configurations OAuth (`<site>/auth/callback`).
2. L'URL de redirection est inscrite dans le dashboard Supabase et chez les providers OAuth (Google, etc.). On ne peut pas la déplacer sans casser les flux en cours.
3. Le route group `(auth)` projette ses pages directement sous `/`, ce qui produirait `<site>/callback` : incohérent avec la convention attendue.

## Conséquence opérationnelle

- **`app/(auth)/`** : pages d'auth de l'utilisateurice (formulaires de connexion, inscription, mot de passe oublié, vérifier email…). Partagent un layout commun via le route group.
- **`app/auth/`** : routes techniques côté serveur (`callback`, et plus tard si besoin `signout`, `error`…). Pas de layout partagé, ce sont des handlers HTTP.

**Ne pas déplacer `app/auth/callback/route.ts` dans `app/(auth)/`** : cela casserait le callback OAuth et Magic Link.

## Référence

- Chantier d'origine : 1.2 (auth + Supabase).
- Constaté lors du chantier V2.0.2 (hygiène repo, cycle V2) qui avait initialement listé cette coexistence comme « route group fantôme à nettoyer » — vérification a montré que la coexistence est intentionnelle. Voir `docs/manifests/v2-0-2-csp-hygiene.md`.
