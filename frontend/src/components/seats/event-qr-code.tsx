"use client";

type EventQrCodeProps = {
  url: string;
  size?: number;
  label?: string;
};

export function EventQrCode({ url, size = 180, label }: EventQrCodeProps) {
  const qrSrc = `https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=${size}&margin=1`;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrSrc}
        alt={label ?? "Código QR de reserva"}
        width={size}
        height={size}
        className="rounded-lg border border-input bg-white p-2 dark:border-white/10"
      />
      {label && <p className="text-center text-xs text-muted-foreground">{label}</p>}
    </div>
  );
}
