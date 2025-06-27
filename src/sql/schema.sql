create table public.users
(
    id      serial primary key,
    balance decimal(10, 2) default 0.0 not null CHECK (balance >= 0)
);

create table products
(
    id    serial primary key,
    name  text           not null,
    price numeric(10, 2) not null
);

create table public.purchases
(
    id         serial primary key,
    user_id    integer            not null references public.users,
    product_id integer            not null references public.products,
    price      decimal(10, 2)     not null,
    created_at date default now() not null
);