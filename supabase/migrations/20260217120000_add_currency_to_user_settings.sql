alter table public.user_settings
  add column currency text not null default 'USD';

alter table public.user_settings
  add constraint user_settings_currency_check
    check (currency in ('USD', 'GBP', 'EUR', 'CAD', 'MXN'));
