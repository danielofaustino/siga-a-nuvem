"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EventWithChurch, Church } from "@/lib/types";
import { formatShort, formatDay, formatTime } from "@/lib/format";
import { haversineKm, formatKm } from "@/lib/distance";
import {
  parseISO,
  isSameDay,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  areIntervalsOverlapping,
  max as maxDate,
  min as minDate,
} from "date-fns";
import { ptBR } from "date-fns/locale";

type Props = {
  events: EventWithChurch[];
  churches: Church[];
};

const PAGE_SIZE = 5;

export function EventsExplorer({ events, churches }: Props) {
  const [churchFilter, setChurchFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [cursor, setCursor] = useState<Date>(new Date());
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // proximidade via GPS do dispositivo
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  function useDeviceLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Seu navegador não suporta geolocalização.");
      return;
    }
    setGpsLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
        setFiltersOpen(false);
      },
      (err) => {
        // 1: PERMISSION_DENIED, 2: POSITION_UNAVAILABLE, 3: TIMEOUT
        const msg =
          err.code === 1
            ? "Permissão de localização negada. Habilite nas configurações do navegador."
            : err.code === 3
            ? "Tempo esgotado tentando obter sua localização."
            : "Não foi possível obter sua localização.";
        setGeoError(msg);
        setMyLocation(null);
        setGpsLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60_000 },
    );
  }

  function clearProximity() {
    setMyLocation(null);
    setGeoError(null);
    setFiltersOpen(false);
  }

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
    setFiltersOpen(false);
  }

  // todas as tags existentes nos eventos publicados (para os chips)
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const e of events) for (const t of e.tags ?? []) set.add(t);
    return Array.from(set).sort();
  }, [events]);

  // Lista filtrada e (se proximidade ativa) ordenada por distância,
  // com a distância de cada evento já calculada para o card.
  const filtered = useMemo(() => {
    const list = events
      .filter((e) => {
        if (churchFilter !== "all" && e.church?.slug !== churchFilter) return false;
        if (activeTags.length > 0) {
          // OR: evento aparece se tem ao menos uma das tags selecionadas
          const evTags = e.tags ?? [];
          if (!activeTags.some((t) => evTags.includes(t))) return false;
        }
        if (selectedDate) {
          const overlap = areIntervalsOverlapping(
            { start: parseISO(e.start_at), end: parseISO(e.end_at) },
            { start: startOfDay(selectedDate), end: endOfDay(selectedDate) },
            { inclusive: true },
          );
          if (!overlap) return false;
        }
        if (search) {
          const q = search.toLowerCase();
          const matches =
            e.title.toLowerCase().includes(q) ||
            (e.description ?? "").toLowerCase().includes(q) ||
            (e.location ?? "").toLowerCase().includes(q);
          if (!matches) return false;
        }
        return true;
      })
      .map((e) => {
        const c = e.church;
        const distanceKm =
          myLocation && c?.latitude != null && c?.longitude != null
            ? haversineKm(myLocation, { lat: c.latitude, lng: c.longitude })
            : null;
        return { event: e, distanceKm };
      });

    if (myLocation) {
      // ordena ascendente; eventos sem coordenadas vão pro fim
      list.sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }
    return list;
  }, [events, churchFilter, selectedDate, search, myLocation, activeTags]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Se filtros mudam e a página atual ficou fora do range, volta pra 1.
  useEffect(() => {
    setPage(1);
  }, [churchFilter, selectedDate, search, myLocation, activeTags]);

  const pageStart = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  // contador de filtros ativos (para badge do botão no mobile)
  const activeFilterCount =
    (search ? 1 : 0) +
    (churchFilter !== "all" ? 1 : 0) +
    (selectedDate ? 1 : 0) +
    (myLocation ? 1 : 0) +
    activeTags.length;

  // trava o scroll do body enquanto o drawer está aberto no mobile
  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filtersOpen]);

  // dias do mês atual com eventos (para destacar no mini calendário).
  // Para eventos multi-dia, marca cada dia do intervalo.
  const daysWithEvents = useMemo(() => {
    const map = new Map<string, EventWithChurch[]>();
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    for (const e of events) {
      const eStart = parseISO(e.start_at);
      const eEnd = parseISO(e.end_at);
      // intersecta com o mês visível
      if (eEnd < monthStart || eStart > monthEnd) continue;
      const days = eachDayOfInterval({
        start: maxDate([eStart, monthStart]),
        end: minDate([eEnd, monthEnd]),
      });
      for (const d of days) {
        const k = format(d, "yyyy-MM-dd");
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(e);
      }
    }
    return map;
  }, [events, cursor]);

  return (
    <div className="grid gap-6 md:grid-cols-[320px_1fr]">
      {/* botão pra abrir filtros — só no mobile */}
      <div className="md:hidden flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="btn-secondary text-sm inline-flex items-center gap-2"
        >
          <span aria-hidden>☰</span> Filtros
          {activeFilterCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-brand-600 text-white text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
        <p className="text-xs text-slate-500">
          {filtered.length} evento{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* overlay do drawer no mobile */}
      {filtersOpen && (
        <button
          type="button"
          aria-label="Fechar filtros"
          onClick={() => setFiltersOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-slate-900/40"
        />
      )}

      {/* sidebar de filtros + calendário — drawer no mobile, estático no desktop */}
      <aside
        className={`space-y-4 md:static md:translate-x-0 md:w-auto md:max-w-none md:h-auto md:overflow-visible md:bg-transparent md:p-0 md:shadow-none md:z-auto fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm h-full overflow-y-auto bg-slate-50 p-4 shadow-xl transition-transform duration-200 ease-out ${
          filtersOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="md:hidden flex items-center justify-between mb-2">
          <p className="font-semibold text-slate-900">Filtros</p>
          <button
            type="button"
            onClick={() => setFiltersOpen(false)}
            className="text-slate-500 hover:text-slate-900 text-2xl leading-none px-2"
            aria-label="Fechar filtros"
          >
            ×
          </button>
        </div>

        <div className="card p-4">
          <label className="label">Buscar</label>
          <input
            className="input"
            placeholder="Título, local, descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="card p-4 space-y-2">
          <label className="label">Proximidade</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={useDeviceLocation}
              disabled={gpsLoading}
              className="btn-primary flex-1 py-1.5 text-xs"
            >
              {gpsLoading
                ? "Obtendo localização..."
                : myLocation
                ? "📍 Atualizar localização"
                : "📍 Usar minha localização"}
            </button>
            {myLocation && (
              <button
                type="button"
                onClick={clearProximity}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Limpar
              </button>
            )}
          </div>
          {geoError && <p className="text-xs text-red-600">{geoError}</p>}
          {myLocation && !geoError && (
            <p className="text-xs text-green-700">
              ✓ Eventos ordenados pelos mais próximos
            </p>
          )}
        </div>

        {allTags.length > 0 && (
          <div className="card p-4">
            <p className="label">Filtrar por tag</p>
            <div className="flex flex-wrap gap-2">
              {allTags.map((t) => (
                <FilterChip
                  key={t}
                  active={activeTags.includes(t)}
                  onClick={() => toggleTag(t)}
                  label={t}
                />
              ))}
              {activeTags.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTags([]);
                    setFiltersOpen(false);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 px-2"
                >
                  limpar
                </button>
              )}
            </div>
          </div>
        )}

        <div className="card p-4">
          <p className="label">Filtrar por igreja</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={churchFilter === "all"}
              onClick={() => {
                setChurchFilter("all");
                setFiltersOpen(false);
              }}
              label="Todas"
            />
            {churches.map((c) => (
              <FilterChip
                key={c.id}
                active={churchFilter === c.slug}
                onClick={() => {
                  setChurchFilter(c.slug);
                  setFiltersOpen(false);
                }}
                label={c.name}
                color={c.color ?? undefined}
              />
            ))}
          </div>
        </div>

        <MiniCalendar
          cursor={cursor}
          onCursor={setCursor}
          daysWithEvents={daysWithEvents}
          selected={selectedDate}
          onSelect={(d) => {
            setSelectedDate((prev) => (prev && isSameDay(prev, d) ? null : d));
            setFiltersOpen(false);
          }}
        />

        {selectedDate && (
          <button
            className="btn-secondary w-full"
            onClick={() => {
              setSelectedDate(null);
              setFiltersOpen(false);
            }}
          >
            Limpar data: {format(selectedDate, "dd/MM/yyyy")}
          </button>
        )}

        <button
          type="button"
          onClick={() => setFiltersOpen(false)}
          className="btn-primary w-full md:hidden"
        >
          Ver {filtered.length} evento{filtered.length === 1 ? "" : "s"}
        </button>
      </aside>

      {/* lista de eventos */}
      <section className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card p-8 text-center text-slate-500">
            Nenhum evento encontrado com esses filtros.
          </div>
        ) : (
          <>
            {pageItems.map(({ event, distanceKm }) => (
              <EventCard key={event.id} event={event} distanceKm={distanceKm} />
            ))}
            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                total={filtered.length}
                pageStart={pageStart}
                pageEnd={pageStart + pageItems.length}
                onPage={setPage}
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? "bg-brand-600 text-white border-brand-600"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      }`}
      style={
        active && color
          ? { backgroundColor: color, borderColor: color, color: "#fff" }
          : undefined
      }
    >
      {label}
    </button>
  );
}

function EventCard({
  event,
  distanceKm,
}: {
  event: EventWithChurch;
  distanceKm?: number | null;
}) {
  const address = event.location || event.church?.address || null;
  return (
    <Link
      href={`/eventos/${event.id}`}
      className="block card p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {event.church && (
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: event.church.color ?? "#3b65ff" }}
              />
            )}
            <span className="text-xs text-slate-500">
              {event.church?.name ?? "Evento geral"}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900">{event.title}</h3>
          <p className="text-sm text-slate-600 mt-1">
            📅 {formatShort(event.start_at)}
            {address && <> · 📍 {address}</>}
          </p>
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {event.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          {distanceKm != null && (
            <p className="text-xs text-brand-700 mt-1 font-medium">
              ~ {formatKm(distanceKm)} de você
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-slate-400">presenças</div>
          <div className="text-lg font-bold text-brand-600">
            {event.attendance_count ?? 0}
          </div>
        </div>
      </div>
    </Link>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  pageStart,
  pageEnd,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageStart: number;
  pageEnd: number;
  onPage: (n: number) => void;
}) {
  const prev = () => onPage(Math.max(1, page - 1));
  const next = () => onPage(Math.min(totalPages, page + 1));
  return (
    <div className="flex items-center justify-between gap-2 pt-2">
      <p className="text-xs text-slate-500">
        {pageStart + 1}–{pageEnd} de {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={prev}
          disabled={page === 1}
          className="btn-secondary text-xs px-2.5 py-1 disabled:opacity-40"
          aria-label="página anterior"
        >
          ‹
        </button>
        <span className="text-xs text-slate-600 px-2">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={next}
          disabled={page === totalPages}
          className="btn-secondary text-xs px-2.5 py-1 disabled:opacity-40"
          aria-label="próxima página"
        >
          ›
        </button>
      </div>
    </div>
  );
}

function MiniCalendar({
  cursor,
  onCursor,
  daysWithEvents,
  selected,
  onSelect,
}: {
  cursor: Date;
  onCursor: (d: Date) => void;
  daysWithEvents: Map<string, EventWithChurch[]>;
  selected: Date | null;
  onSelect: (d: Date) => void;
}) {
  const start = startOfMonth(cursor);
  const end = endOfMonth(cursor);
  const days = eachDayOfInterval({ start, end });
  // padding até a 1ª segunda (calendário começa segunda)
  const padStart = (start.getDay() + 6) % 7;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => onCursor(subMonths(cursor, 1))}
          className="text-slate-500 hover:text-slate-900 px-2"
          aria-label="mês anterior"
        >
          ‹
        </button>
        <p className="text-sm font-semibold capitalize">
          {format(cursor, "MMMM yyyy", { locale: ptBR })}
        </p>
        <button
          onClick={() => onCursor(addMonths(cursor, 1))}
          className="text-slate-500 hover:text-slate-900 px-2"
          aria-label="próximo mês"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[10px] text-slate-400 text-center mb-1">
        {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: padStart }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const has = daysWithEvents.has(key);
          const isSelected = selected && isSameDay(d, selected);
          return (
            <button
              key={key}
              onClick={() => onSelect(d)}
              className={`relative aspect-square rounded text-xs flex items-center justify-center transition-colors ${
                isSelected
                  ? "bg-brand-600 text-white font-semibold"
                  : has
                  ? "bg-brand-50 text-brand-700 font-medium hover:bg-brand-100"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {d.getDate()}
              {has && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
