-- ============================================================================
-- Revue 2026 (correctif C28) — Index de performance sur signature_petition.
-- ============================================================================
--
-- La fonction compteurs_commune() filtre signature_petition par
-- `code_postal IN (...)` (compteur de signataires d'une commune). Le seul
-- index existant porte sur substring(code_postal,1,2) (département), inutilisable
-- pour une égalité de code postal complet : sans cet index, chaque visite de la
-- fiche commune (/communes/[code_insee], page indexable SEO) provoque un seq
-- scan de ~17 746 lignes, deux fois.
--
-- Migration ADDITIVE (doctrine de greffe §0.3) : ajout d'un index seul, aucune
-- table ni colonne touchée, aucune donnée modifiée. Local d'abord ; à pousser au
-- distant de Francfort en Phase M avec les autres migrations en attente.
-- ============================================================================

create index if not exists signature_petition_code_postal_idx
  on public.signature_petition (code_postal);
