-- =============================================================================
-- ShopSphere · 004 · Storage buckets
-- Public buckets serve images by URL to everyone; only the rules below
-- decide who may upload, replace or delete files.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('category-images', 'category-images', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('avatars', 'avatars', true, 2097152,
    array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Catalog images: admins only.
create policy "Admins upload catalog images"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('product-images', 'category-images') and (select public.is_admin()));

create policy "Admins update catalog images"
  on storage.objects for update to authenticated
  using (bucket_id in ('product-images', 'category-images') and (select public.is_admin()));

create policy "Admins delete catalog images"
  on storage.objects for delete to authenticated
  using (bucket_id in ('product-images', 'category-images') and (select public.is_admin()));

-- Avatars: each user may only touch files inside a folder named after their id,
-- e.g. avatars/3f1c…/photo.webp
create policy "Users upload own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users update own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users delete own avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
