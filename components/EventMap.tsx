type Props = {
  address: string;
  height?: number;
  className?: string;
};

/**
 * Mapa do Google embedado via iframe gratuito (sem API key).
 * Limitação: 1 marcador por mapa.
 */
export function EventMap({ address, height = 220, className = "" }: Props) {
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&hl=pt-BR&z=16&output=embed`;
  const link = `https://maps.google.com/maps?q=${encodeURIComponent(address)}`;
  return (
    <div className={`overflow-hidden rounded-lg border border-slate-100 ${className}`}>
      <iframe
        src={src}
        width="100%"
        height={height}
        style={{ border: 0, display: "block" }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Mapa: ${address}`}
      />
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-xs text-brand-700 hover:underline px-3 py-1.5 bg-slate-50"
      >
        Abrir no Google Maps →
      </a>
    </div>
  );
}
