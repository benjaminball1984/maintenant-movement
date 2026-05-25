-- Migration 037 : compteurs territoriaux anonymisés par commune (chantier 13.3-C).
--
-- Objectif : alimenter la « fiche commune » (référentiel `commune_reference`,
-- ~35 000 communes + 45 arrondissements) avec des compteurs AGRÉGÉS et
-- ANONYMISÉS : nombre d'inscrit·es, de signataires, d'abonné·es newsletter
-- rattaché·es à la commune. Aucune donnée personnelle n'est exposée : seuls
-- des `count(*)` sortent de cette fonction.
--
-- Pourquoi une fonction SECURITY DEFINER : les tables `signature_petition` et
-- `personne` ne sont pas lisibles publiquement (RLS vie privée). La fonction
-- s'exécute avec les droits du propriétaire pour calculer l'agrégat sans
-- exposer les lignes (même principe que `nombre_signatures`, migration 013).
--
-- Règle de résolution code_postal -> code_insee (cf. migration 036) : un code
-- postal dessert souvent plusieurs communes. On attribue une personne/signature
-- à UNE seule commune : la plus peuplée parmi celles desservies par son code
-- postal (départage déterministe par `code_insee` à population égale). Un code
-- postal sans correspondance reste non rattaché (jamais deviné).

create or replace function public.compteurs_commune(cible_insee text)
returns table (inscrits bigint, signataires bigint, abonnes bigint)
language sql
stable
security definer
set search_path = public
as $$
  -- Codes postaux dont la commune RÉSOLUE (la plus peuplée) est `cible_insee`.
  with cps_resolus as (
    select code_postal
    from (
      select distinct on (c.code_postal)
        c.code_postal,
        c.code_insee as insee_resolu
      from public.correspondance_cp_insee c
      left join public.commune_reference r on r.code_insee = c.code_insee
      -- la plus peuplée d'abord ; à égalité, le plus petit code_insee.
      order by c.code_postal, r.population desc nulls last, c.code_insee
    ) resolution
    where resolution.insee_resolu = cible_insee
  )
  select
    (
      select count(*)
      from public.personne p
      where p.statut = 'actif'
        and p.code_postal in (select code_postal from cps_resolus)
    ) as inscrits,
    (
      select count(*)
      from public.signature_petition s
      where s.code_postal in (select code_postal from cps_resolus)
    ) as signataires,
    (
      select count(*)
      from public.signature_petition s
      where s.accepte_newsletter = true
        and s.code_postal in (select code_postal from cps_resolus)
    ) as abonnes
$$;

comment on function public.compteurs_commune(text) is
  'Compteurs territoriaux anonymisés (inscrits, signataires, abonnés) d''une commune du référentiel, par résolution code_postal -> commune la plus peuplée. Lecture publique, n''expose aucune donnée personnelle.';

-- Lecture publique de l'agrégat : tout le monde peut consulter une fiche commune.
grant execute on function public.compteurs_commune(text) to anon, authenticated;
