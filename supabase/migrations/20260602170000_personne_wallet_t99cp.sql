-- ============================================================================
-- Référence wallet 99-coin sur le profil (décision Lilou/Ben 2026-05-31).
-- ============================================================================
--
-- Architecture des paiements : tout se règle ENTRE MEMBRES (sauf 4 exceptions
-- plateforme : don réseau social, don Maintenant Médias, adhésion, cagnottes
-- plateforme). Pour être payé·e en 99-coin (marché, SEL payant, prêt payant,
-- etc.), un membre renseigne UNE FOIS sa référence wallet sur son profil ;
-- toutes ses offres payantes l'utilisent. (En euros, l'équivalent est le compte
-- Stripe Connect.)
--
-- Une offre PEUT être publiée sans wallet À CONDITION d'être gratuite ; une
-- cagnotte exige toujours un wallet (pas d'option gratuite). La vérification
-- « payant => wallet requis » se fait côté application, par espace.
--
-- Migration ADDITIVE (doctrine de greffe §0.3) : colonne nullable, aucun défaut
-- contraignant, aucune donnée touchée. Format = adresse Polygon (0x + 40 hex),
-- cohérent avec `cagnotte.wallet_t99cp`. `personne` est une table de base,
-- présente en local : appliquée en local, distant en Phase M.
-- ============================================================================

alter table public.personne
  add column if not exists wallet_t99cp text;

comment on column public.personne.wallet_t99cp is
  'Référence wallet 99-coin (adresse Polygon 0x + 40 hex) pour recevoir des paiements entre membres. NULL = non renseignée (le membre ne peut alors créer que des offres gratuites). Décision paiements 2026-05-31.';

-- Borne de cohérence du format (idempotent : ré-exécution locale tolérée).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'personne_wallet_t99cp_format'
  ) then
    alter table public.personne
      add constraint personne_wallet_t99cp_format
        check (wallet_t99cp is null or wallet_t99cp ~ '^0x[a-fA-F0-9]{40}$');
  end if;
end $$;
