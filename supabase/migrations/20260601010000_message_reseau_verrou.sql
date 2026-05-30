-- ============================================================================
-- Chantier V2.6.9 (épopée réseau V2, chantier D.3) — Messagerie verrouillée
-- ============================================================================
--
-- Cf. docs/specs/09_RESEAU-SOCIAL-V2.md §4.
--
-- AVANT : tout·e personne connectée pouvait écrire à n'importe qui (la RLS
-- d'insertion de message_reseau ne vérifiait que `expediteur_id = auth.uid()`).
--
-- APRÈS : on n'écrit qu'à
--   - un·e ami·e (relation acceptée), OU
--   - une personne qui a activé « n'importe qui peut m'envoyer un message »
--     (préférence `messagerie_ouverte`, défaut false), OU
--   - une personne qui t'a DÉJÀ écrit (on peut toujours répondre à un fil
--     ouvert par l'autre : évite de piéger une conversation).
--
-- Changement de COMPORTEMENT (on resserre), additif côté données : aucun
-- message existant n'est supprimé, seules les nouvelles insertions sont
-- soumises au verrou. Cf. CLAUDE.md §0.4 (écart V1→V2 signalé au manifest).
--
-- Migration LOCALE (non poussée au distant avant la Phase M).
-- ============================================================================

-- ============================================================
-- Helper : le lecteur courant peut-il écrire à `destinataire` ?
-- ============================================================
create or replace function public.peut_envoyer_message_reseau(destinataire uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and auth.uid() <> destinataire
    and (
      -- 1) on est ami·es
      public.est_ami_reseau(destinataire)
      -- 2) la cible a ouvert sa messagerie à tout le monde
      or coalesce(
        (select (p.preferences_visibilite->>'messagerie_ouverte')::boolean
           from public.personne p where p.id = destinataire),
        false
      )
      -- 3) la cible m'a déjà écrit (réponse à un fil qu'elle a ouvert)
      or exists (
        select 1 from public.message_reseau m
        where m.expediteur_id = destinataire and m.destinataire_id = auth.uid()
      )
    );
$$;

comment on function public.peut_envoyer_message_reseau(uuid) is
  'True si le lecteur courant peut envoyer un message à la cible (ami·e, messagerie ouverte, ou réponse à un fil existant).';

revoke execute on function public.peut_envoyer_message_reseau(uuid) from public;
grant execute on function public.peut_envoyer_message_reseau(uuid) to authenticated, service_role;

-- ============================================================
-- RLS : insertion de message_reseau soumise au verrou
-- ============================================================
drop policy if exists "message_reseau_insert" on public.message_reseau;
create policy "message_reseau_insert" on public.message_reseau for insert
  with check (
    expediteur_id = auth.uid()
    and public.peut_envoyer_message_reseau(destinataire_id)
  );
