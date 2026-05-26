-- Bucket Supabase Storage pour les images uploadées par les utilisateurices.
--
-- Posé par le chantier V2.0.3 (cycle V2, exigence ET2). Activé en
-- production seulement (`IMAGE_STORAGE_PROVIDER=supabase`). Le mode mock
-- ne nécessite PAS cette migration.
--
-- À appliquer manuellement avec `supabase db push` ou
-- `npx tsx scripts/appliquer-sql-distant.ts` (DDL pur, sans PII).
--
-- Convention de chemin dans le bucket :
--   <prefixe-optionnel>/<role>/<uuid>.<ext>
--
-- Exemples :
--   couverture/abc123.jpg
--   petitions/42/couverture/def456.webp
--   profils/<user_id>/icone/ghi789.png

-- ============================================================
-- 1. Bucket public `media`
-- ============================================================
-- Limite de taille : 5 Mo (5 * 1024 * 1024 octets).
-- Cohérent avec lib/storage/types.ts TAILLE_MAX_OCTETS.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ============================================================
-- 2. Policies RLS sur storage.objects
-- ============================================================
-- On utilise des noms uniques pour pouvoir relancer la migration sans
-- conflits (idempotent via `drop policy if exists`).

-- 2.1. Lecture publique : toute personne peut lire (le bucket est public,
-- mais Supabase exige des policies explicites quand RLS est activée).
drop policy if exists "media_select_public" on storage.objects;
create policy "media_select_public"
on storage.objects
for select
using (bucket_id = 'media');

-- 2.2. Insert : uniquement les comptes authentifiés.
drop policy if exists "media_insert_authenticated" on storage.objects;
create policy "media_insert_authenticated"
on storage.objects
for insert
with check (
  bucket_id = 'media'
  and auth.role() = 'authenticated'
);

-- 2.3. Delete : la personne qui a uploadé peut supprimer son propre fichier.
-- Le champ `owner` (uuid) est rempli automatiquement par Supabase Storage
-- à l'upload avec `auth.uid()`.
drop policy if exists "media_delete_own" on storage.objects;
create policy "media_delete_own"
on storage.objects
for delete
using (
  bucket_id = 'media'
  and auth.uid() = owner
);

-- 2.4. Update : la personne qui a uploadé peut écraser/renommer son fichier.
drop policy if exists "media_update_own" on storage.objects;
create policy "media_update_own"
on storage.objects
for update
using (
  bucket_id = 'media'
  and auth.uid() = owner
);
