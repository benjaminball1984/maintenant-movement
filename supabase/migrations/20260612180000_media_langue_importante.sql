-- Migration : revue de presse sur Maintenant Médias (demande Ben
-- 2026-06-12). Deux colonnes ADDITIVES sur `media` :
--
--   1. `langue` : les brèves importées gardent la langue du site source
--      (fr, en, es...). Null = français (contenus maison).
--   2. `importante` : pilote la mosaïque de la page (décision Ben) :
--      une brève illustrée est « importante » (image + 5-7 lignes), une
--      brève sans visuel est « annexe » (3-4 lignes, format réduit).
--      Les contenus maison sont toujours affichés en grand, ce drapeau
--      ne concerne que les brèves.

alter table public.media
  add column if not exists langue text;

alter table public.media
  add constraint media_langue_format
  check (langue is null or langue ~ '^[a-z]{2}$');

comment on column public.media.langue is
  'Langue du contenu (ISO 639-1). Null = français. Les brèves importées gardent la langue de leur site source.';

alter table public.media
  add column if not exists importante boolean not null default false;

comment on column public.media.importante is
  'Mosaïque de la revue de presse : true = brève mise en avant (image + 5-7 lignes), false = brève annexe (3-4 lignes).';
