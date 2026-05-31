-- ============================================================================
-- Revue 2026 (décision D5) : frais de port du marché solidaire.
-- ============================================================================
--
-- Conforme à la fiche CDC `marche-solidaire-V2.md` §"Frais de port" :
--   - Crypto  : le port est payé en POL (Polygon natif), PAS en T99CP. POL au
--               taux du moment. Alerte UX "prévoir du POL".
--   - Euros   : le port est payé en euros via Stripe.
--   - Pas de commission Maintenant! sur le port (paiement direct vendeureuse).
--
-- Modèle retenu (fidèle à la fiche, sans invention de fond) : la vendeureuse
-- fixe UN montant de référence en euros (`frais_port_centimes`), facturé en sus
-- du prix uniquement si la personne acheteuse choisit l'envoi postal. Pour un
-- achat crypto, ce montant de référence est converti en POL au taux du moment
-- (affichage + alerte côté UI ; la conversion réelle relève du wallet, hors
-- périmètre mock). Cohérent avec le double prix existant euros / T99CP.
--
-- Migration ADDITIVE (doctrine de greffe §0.3) : la colonne arrive avec un
-- DEFAULT 0, donc TOUS les produits existants gardent un comportement
-- strictement identique (port nul, total inchangé). Aucune donnée touchée.
-- `produit_marche` est une table V1, présente dans la base de démo LOCALE :
-- cette migration s'applique en local et au distant en Phase M.
-- ============================================================================

alter table public.produit_marche
  add column if not exists frais_port_centimes integer not null default 0;

comment on column public.produit_marche.frais_port_centimes is
  'Frais de port en euros (centimes) fixés par la vendeureuse, facturés en sus du prix si la personne acheteuse choisit l''envoi. 0 = pas de frais. Montant de référence converti en POL au taux du moment pour un achat crypto (CDC marché §Frais de port).';

-- Borne de cohérence (0 à 1000 €). Idempotent pour tolérer une ré-exécution
-- locale (les contraintes ne supportent pas `add constraint if not exists`).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'produit_marche_frais_port_valide'
  ) then
    alter table public.produit_marche
      add constraint produit_marche_frais_port_valide
        check (frais_port_centimes >= 0 and frais_port_centimes <= 100000);
  end if;
end $$;
