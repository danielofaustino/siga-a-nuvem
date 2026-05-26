-- Adiciona instagram e coordenadas geográficas às igrejas.
-- Coordenadas são preenchidas via geocoding (Nominatim) quando a igreja
-- é criada/editada com endereço.

alter table public.churches
  add column if not exists instagram   text,
  add column if not exists latitude    double precision,
  add column if not exists longitude   double precision;

create index if not exists churches_geo_idx on public.churches(latitude, longitude);
