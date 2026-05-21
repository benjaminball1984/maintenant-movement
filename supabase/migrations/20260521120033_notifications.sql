-- Migration 033 : Notifications (chantier 8.1).
--
-- Cf. docs/specs/01_ARCHITECTURE.md §10 :
--   « 5 canaux hiérarchisés : messagerie interne (primaire) + cloche +
--     push opt-in + mail récap mardi + newsletter vendredi. Préférences
--     par canal et type. »
--
-- Modèle :
--   - notification : ligne in-app (cloche), liée à une personne et une
--     entité (mobilisation, cagnotte, etc.).
--   - preference_notification : 1 ligne par personne avec un JSONB
--     d'opt-ins par canal × type. Défaut sensé : haute priorité ON,
--     périphérique OFF.

create table public.notification (
  id uuid primary key default gen_random_uuid(),

  destinataire_id uuid not null references public.personne(id) on delete cascade,

  -- Type fonctionnel : sert au filtrage et aux préférences.
  -- Liste évolutive (commentaire indicatif) :
  --   - signature_petition  : ma pétition a été signée
  --   - dm                  : message direct
  --   - moderation          : moderation me concernant
  --   - mention             : on m'a mentionné·e
  --   - participation       : on a rejoint mon moment / cagnotte
  --   - relance_adhesion    : adhésion bientôt expirée
  --   - objectif_atteint    : ma pétition a atteint son objectif
  --   - autre               : tout le reste
  type text not null,

  -- Lien vers une entité (table + id). Optionnel pour les notifs
  -- système (relance adhésion, etc.).
  cible_table text,
  cible_id uuid,

  -- Contenu court affiché dans la cloche.
  titre text not null,
  message text,
  /** URL interne pour rediriger au clic. */
  href text,

  -- Cycle de vie.
  lue boolean not null default false,
  lue_le timestamptz,

  created_at timestamptz not null default now(),

  constraint notification_type_valide check (length(type) > 0 and length(type) <= 50),
  constraint notification_lue_coherent check (
    (lue = true and lue_le is not null) or (lue = false and lue_le is null)
  )
);

comment on table public.notification is
  'Notifications in-app (cloche). Cf. spec §10 hiérarchie 5 canaux. La messagerie interne primaire = chantier 7.5.';

create index notification_destinataire_idx on public.notification (destinataire_id, created_at desc);
create index notification_non_lues_idx on public.notification (destinataire_id) where lue = false;

alter table public.notification enable row level security;

create policy "notification_select"
  on public.notification for select
  using (destinataire_id = auth.uid() or public.est_admin_general());

create policy "notification_insert"
  on public.notification for insert
  with check (true); -- inséré par les Server Actions / service_role

create policy "notification_update"
  on public.notification for update
  using (destinataire_id = auth.uid());

-- ============================================================
-- Préférences de notification — 1 ligne par personne, JSONB
-- ============================================================

create table public.preference_notification (
  personne_id uuid primary key references public.personne(id) on delete cascade,

  -- Activation par canal (cf. spec §10 hiérarchie).
  -- Défauts : in-app et cloche ON, push opt-in, mails ON.
  cloche_active boolean not null default true,
  push_active boolean not null default false,
  mail_recap_mardi_active boolean not null default true,
  newsletter_vendredi_active boolean not null default true,

  -- Préférences fines par type de notification (JSONB).
  -- Format : { "signature_petition": true, "moderation": true, ... }
  preferences_par_type jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.preference_notification is
  'Préférences notification par personne. Cf. spec §10 « préférences par canal et type ».';

create trigger preference_notification_updated_at
  before update on public.preference_notification
  for each row
  execute function public.tg_set_updated_at();

alter table public.preference_notification enable row level security;

create policy "preference_notification_select"
  on public.preference_notification for select
  using (personne_id = auth.uid() or public.est_admin_general());

create policy "preference_notification_insert"
  on public.preference_notification for insert
  with check (auth.uid() is not null and personne_id = auth.uid());

create policy "preference_notification_update"
  on public.preference_notification for update
  using (personne_id = auth.uid());
