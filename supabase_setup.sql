-- Esquema para proyecto Supabase nuevo (Bella).
-- Ejecutar en el SQL Editor del proyecto nuevo, de una sola vez.
-- Las fotos ya no viven en Storage: Cloudinary entrega las URLs.

create table public.products (
  id bigserial primary key,
  name text not null,
  category text not null,
  promo text not null,
  price text default '',
  image text not null,
  colors text[] not null default '{}',
  sizes text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

-- Catálogo público, escritura solo con sesión autenticada (admin).
create policy "products public read"
  on public.products for select
  using (true);

create policy "products admin insert"
  on public.products for insert
  to authenticated
  with check (true);

create policy "products admin update"
  on public.products for update
  to authenticated
  using (true)
  with check (true);

create policy "products admin delete"
  on public.products for delete
  to authenticated
  using (true);

-- "Automatically expose new tables" va OFF: los grants van explícitos.
grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant usage, select on sequence public.products_id_seq to authenticated;

notify pgrst, 'reload schema';

-- La app escucha cambios en vivo desde el panel.
alter publication supabase_realtime add table public.products;

-- Copia al catálogo mayorista: la fila nueva apunta a la fila original (evita comparar por nombre).
alter table public.products add column if not exists origin_id bigint;

-- Opcional: enlazar las copias que ya existen (mismo nombre que su original del catálogo normal).
update public.products c
  set origin_id = r.id
  from public.products r
 where c.wholesale_only and not r.wholesale_only and c.origin_id is null and c.name = r.name;
