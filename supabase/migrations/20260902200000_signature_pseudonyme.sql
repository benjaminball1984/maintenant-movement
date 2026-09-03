-- ============================================================================
-- V2.6.138 — Signer sous un pseudonyme (signatures individuelles seulement).
--
-- Demande de Lilou/Ben (02/09/2026) : toute personne ne peut pas donner son
-- nom civil pour signer un texte politique — statut administratif fragile,
-- employeur hostile, violences conjugales, exposition publique. Elle doit
-- pouvoir signer sous un pseudonyme, sans que nom et prénom soient exigés.
--
-- Deux garde-fous posés ici, à la demande de Lilou/Ben :
--   1. Le pseudonyme ne vaut QUE pour les signatures individuelles. Une
--      organisation signe par la main d'une personne identifiable, qu'il faut
--      pouvoir recontacter : nom et prénom y restent obligatoires.
--   2. L'adhésion n'est PAS concernée. Elle passe par un compte, et
--      l'inscription exige nom + prénom (`lib/validations/auth.ts`). Rien
--      n'est touché ici de ce côté : aucune colonne de `personne` ne bouge.
--
-- Migration ADDITIVE au sens de la doctrine de greffe (CLAUDE.md §0.3) : on
-- ajoute une colonne, et on RELÂCHE deux contraintes `not null`. Relâcher ne
-- retire aucune donnée : les 17 746 signatures existantes gardent leur nom et
-- leur prénom, et la nouvelle contrainte de cohérence les accepte toutes.
-- ============================================================================

alter table public.signature_petition
  add column if not exists pseudonyme text;

comment on column public.signature_petition.pseudonyme is
  'Nom d''emprunt choisi par la personne qui signe, quand elle ne veut pas donner son identite civile. Signatures individuelles uniquement.';

-- Nom et prénom deviennent facultatifs : ils sont remplacés par le pseudonyme
-- quand la personne le choisit. Aucune ligne existante n'est modifiée.
alter table public.signature_petition
  alter column nom drop not null;

alter table public.signature_petition
  alter column prenom drop not null;

-- ============================================================
-- Cohérence de l'identité selon le type de signataire
-- ============================================================
--
-- Individu      : au moins une identité lisible — nom, prénom ou pseudonyme.
-- Organisation  : nom ET prénom de la personne référente, pas de pseudonyme.
--
-- Pourquoi la règle « au moins un » et pas « nom ET prénom, ou pseudonyme »,
-- qui serait la règle du formulaire : constaté le 02/09/2026, **5 924 des
-- 17 967 signatures déjà en base ont un prénom vide** (import de l'ancienne
-- plateforme, où seul le nom avait été collecté). Une contrainte plus stricte
-- les rejetterait, et la migration échouerait — ou pire, il faudrait les
-- modifier. La doctrine de greffe l'interdit : on n'abîme pas l'existant pour
-- faire entrer une règle nouvelle.
--
-- La règle stricte demandée par Lilou/Ben (nom ET prénom, ou pseudonyme) est
-- donc appliquée **à la saisie**, dans le schéma Zod de la modale et de la
-- Server Action (`lib/validations/petition.ts`). Cette contrainte-ci est le
-- plancher : elle garantit qu'aucune signature ne peut être anonyme au point
-- de ne porter aucun nom du tout. Même partage des rôles que partout ailleurs
-- dans le projet : SQL = dernière ligne de défense, Zod = politique du jour.
--
-- Le `btrim(...) <> ''` compte autant que le `not null` : une chaîne d'espaces
-- passerait un simple test de nullité et laisserait une signature sans aucune
-- identité lisible.

alter table public.signature_petition
  drop constraint if exists signature_identite_coherente;

alter table public.signature_petition
  add constraint signature_identite_coherente check (
    (
      type_signataire = 'individu'
      and (
        (nom is not null and btrim(nom) <> '')
        or (prenom is not null and btrim(prenom) <> '')
        or (pseudonyme is not null and btrim(pseudonyme) <> '')
      )
    )
    or (
      type_signataire = 'organisation'
      and nom is not null and btrim(nom) <> ''
      and prenom is not null and btrim(prenom) <> ''
      and pseudonyme is null
    )
  );
