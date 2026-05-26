"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EventWithChurch, Church } from "@/lib/types";
import { formatShort, formatDay, formatTime } from "@/lib/format";
import { EventMap } from "./EventMap";
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

export function EventsExplorer({ events, churches }: Props) {
  const [churchFilter, setChurchFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [cursor, setCursor] = useState<Date>(new Date());
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (churchFilter !== "all" && e.church?.slug !== churchFilter) return false;
      if (selectedDate) {
        // evento aparece no dia X se o intervalo [start, end] cobre qualquer
        // parte daquele dia (útil para eventos multi-dia)
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
    });
  }, [events, churchFilter, selectedDate, search]);

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
      {/* sidebar de filtros + calendário */}
      <aside className="space-y-4">
        <div className="card p-4">
          <label className="label">Buscar</label>
          <input
            className="input"
            placeholder="Título, local, descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="card p-4">
          <p className="label">Filtrar por igreja</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={churchFilter === "all"}
              onClick={() => setChurchFilter("all")}
              label="Todas"
            />
            {churches.map((c) => (
              <FilterChip
                key={c.id}
                active={churchFilter === c.slug}
                onClick={() => setChurchFilter(c.slug)}
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
          onSelect={(d) => setSelectedDate((prev) => (prev && isSameDay(prev, d) ? null : d))}
        />

        {selectedDate && (
          <button
            className="btn-secondary w-full"
            onClick={() => setSelectedDate(null)}
          >
            Limpar data: {format(selectedDate, "dd/MM/yyyy")}
          </button>
        )}
      </aside>

      {/* lista de eventos */}
      <section className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card p-8 text-center text-slate-500">
            Nenhum evento encontrado com esses filtros.
          </div>
        ) : (
          filtered.map((e) => <EventCard key={e.id} event={e} />)
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

function EventCard({ event }: { event: EventWithChurch }) {
  const address = event.location || event.church?.address || null;
  return (
    <div className="card overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/eventos/${event.id}`} className="block p-4">
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
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-slate-400">presenças</div>
            <div className="text-lg font-bold text-brand-600">
              {event.attendance_count ?? 0}
            </div>
          </div>
        </div>
      </Link>
      {address && (
        <div className="px-4 pb-4">
          <EventMap address={address} height={180} />
        </div>
      )}
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
