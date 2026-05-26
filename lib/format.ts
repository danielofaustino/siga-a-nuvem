import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatEventDate(iso: string, allDay = false) {
  const d = parseISO(iso);
  return allDay
    ? format(d, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : format(d, "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatShort(iso: string) {
  return format(parseISO(iso), "dd/MM 'às' HH:mm", { locale: ptBR });
}

export function formatTime(iso: string) {
  return format(parseISO(iso), "HH:mm", { locale: ptBR });
}

export function formatDay(iso: string) {
  return format(parseISO(iso), "dd 'de' MMM", { locale: ptBR });
}

export function isoToInputDateTime(iso: string) {
  // formato esperado por <input type="datetime-local">: "yyyy-MM-ddTHH:mm"
  return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm");
}
