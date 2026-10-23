-- Zenithrilled — Supabase schema
-- Run this in: Supabase Dashboard → your project → SQL Editor → New query → paste → Run
-- (One-time setup. Safe to re-run except the seed section at the bottom.)

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default '',
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  image_url text not null default '',
  show_stock boolean not null default false,
  stock_qty int not null default 0,
  created_at timestamptz not null default now()
);

-- Ensure category column exists if table was already created
alter table products add column if not exists category text not null default '';

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table categories enable row level security;
drop policy if exists "categories_all" on categories;
create policy "categories_all" on categories for all using (true) with check (true);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  customer_note text not null default '',
  status text not null default 'new'
    check (status in ('new','in_progress','shipped','delivered','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  qty int not null check (qty > 0),
  unit_price numeric(10,2) not null
);

alter table orders enable row level security;
alter table order_items enable row level security;

-- Anyone (including customers) can browse products and place orders.
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'products' and policyname = 'products_public') then
    create policy products_public on products for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'orders' and policyname = 'orders_insert_public') then
    create policy orders_insert_public on orders for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'order_items' and policyname = 'order_items_insert_public') then
    create policy order_items_insert_public on order_items for insert with check (true);
  end if;
end
$$;

-- ---------------------------------------------------------------
-- Admins get write access via the admin_users table below.
-- ---------------------------------------------------------------
create table if not exists admin_users (
  auth_uid uuid primary key references auth.users(id),
  display_name text not null default ''
);

alter table admin_users enable row level security;

-- Admins can read everything (used by the app to show "You're an admin").
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'admin_users' and policyname = 'admin_read_self') then
    create policy admin_read_self on admin_users for select
      using (auth.uid() = auth_uid);
  end if;
end
$$;

-- Admins can add themselves after a real user account is created
-- (first admin is added manually in the dashboard, see README).
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'admin_users' and policyname = 'admin_insert_self') then
    create policy admin_insert_self on admin_users for insert
      with check (auth.uid() = auth_uid);
  end if;
end
$$;

create or replace function is_admin() returns boolean
language sql stable
as $$
  select exists (select 1 from admin_users where auth_uid = auth.uid());
$$;

-- Admins manage products and orders.
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'products' and policyname = 'products_admin_write') then
    create policy products_admin_write on products
      for all using (is_admin()) with check (is_admin());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'orders' and policyname = 'orders_admin_update') then
    create policy orders_admin_update on orders
      for update using (is_admin()) with check (is_admin());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'orders' and policyname = 'orders_admin_select') then
    create policy orders_admin_select on orders
      for select using (is_admin());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'order_items' and policyname = 'order_items_admin_all') then
    create policy order_items_admin_all on order_items
      for all using (is_admin()) with check (is_admin());
  end if;
end
$$;

-- Orders are still readable by their own customer (for the "track your order"
-- view on the customer side — matched by email on the customer site).
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'orders' and policyname = 'orders_own_email_select') then
    create policy orders_own_email_select on orders
      for select using (customer_email = lower(coalesce(auth.jwt() ->> 'email', '')) );
  end if;
  if not exists (select 1 from pg_policies where tablename = 'order_items' and policyname = 'order_items_own_email_all') then
    create policy order_items_own_email_all on order_items
      for select using (
        exists (select 1 from orders o
                where o.id = order_items.order_id
                  and o.customer_email = lower(coalesce(auth.jwt() ->> 'email', '')))
      );
  end if;
end
$$;

-- ---------------------------------------------------------------
-- Storage bucket and RLS policies for product images
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Allow product image uploads" on storage.objects;
create policy "Allow product image uploads" on storage.objects
  for insert with check (bucket_id = 'product-images');

drop policy if exists "Allow product image updates" on storage.objects;
create policy "Allow product image updates" on storage.objects
  for update using (bucket_id = 'product-images');

drop policy if exists "Allow product image public read" on storage.objects;
create policy "Allow product image public read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "Allow product image delete" on storage.objects;
create policy "Allow product image delete" on storage.objects
  for delete using (bucket_id = 'product-images');

-- ---------------------------------------------------------------
-- Products & Orders RLS Write policies for the studio
-- ---------------------------------------------------------------
drop policy if exists "products_manage_all" on products;
create policy "products_manage_all" on products
  for all using (true) with check (true);

drop policy if exists "orders_manage_all" on orders;
create policy "orders_manage_all" on orders
  for all using (true) with check (true);

drop policy if exists "order_items_manage_all" on order_items;
create policy "order_items_manage_all" on order_items
  for all using (true) with check (true);

-- ---------------------------------------------------------------
-- Demo data — remove this whole block for production.
-- ---------------------------------------------------------------
insert into products (name, description, price, show_stock, stock_qty) values
  ('Amigurumi Bear', 'A hand-crocheted teddy bear, about 15 cm tall. Filled with soft recycled wool. Hypoallergenic yarn.', 24.00, true, 4),
  ('Dahlia Coasters (set of 6)', 'Floral-inspired coasters in 6 muted pastels. Felt-backed so they grip the table.', 18.50, true, 12),
  ('Chunky Toss Pillow', 'Oversized cushion cover, chunky cotton yarn, button closure. Made to order in any colour you pick.', 39.00, false, 0),
  ('Woodland Frog', 'Little frog that sits on bookshelves. Customisable names, colours and sizes.', 22.00, true, 2)
on conflict do nothing;
