alter table bills add column slug text;

create unique index idx_bills_slug on bills (slug);
