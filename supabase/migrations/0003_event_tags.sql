-- Adiciona tags livres aos eventos (ex: jovens, adolescentes, irmãs, varões).
-- text[] permite múltiplas tags por evento sem precisar de tabela auxiliar.

alter table public.events
  add column if not exists tags text[] not null default '{}';

-- GIN index permite query rápida com `tags @> array['jovens']` e `&&` (overlap)
create index if not exists events_tags_idx on public.events using gin (tags);
