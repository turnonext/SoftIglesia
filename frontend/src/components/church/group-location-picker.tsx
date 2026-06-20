"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  configureLeafletIcons,
  loadLeaflet,
  refreshMapSize,
  type LeafletModule,
} from "@/lib/maps/load-leaflet";
import { useI18n } from "@/i18n";
import { Loader2 } from "lucide-react";

type GroupLocationPickerProps = {
  latitude: number | null;
  longitude: number | null;
  onChange: (coords: { latitude: number; longitude: number }) => void;
  className?: string;
};

export function GroupLocationPicker({
  latitude,
  longitude,
  onChange,
  className,
}: GroupLocationPickerProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | null = null;

    void loadLeaflet()
      .then((L: LeafletModule) => {
        if (cancelled || !containerRef.current) return;
        configureLeafletIcons(L);

        map = L.map(containerRef.current, {
          center: DEFAULT_MAP_CENTER,
          zoom: DEFAULT_MAP_ZOOM,
          scrollWheelZoom: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
          maxZoom: 19,
        }).addTo(map);

        map.on("click", (e) => {
          const { lat, lng } = e.latlng;
          if (markerRef.current) {
            markerRef.current.setLatLng(e.latlng);
          } else {
            markerRef.current = L.marker(e.latlng).addTo(map!);
          }
          onChangeRef.current({ latitude: lat, longitude: lng });
        });

        mapRef.current = map;
        refreshMapSize(map);
        setReady(true);
      })
      .catch(() => setError(true));

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    void loadLeaflet().then((L) => {
      const map = mapRef.current;
      if (!map || latitude == null || longitude == null) return;

      const latLng = L.latLng(latitude, longitude);
      if (markerRef.current) {
        markerRef.current.setLatLng(latLng);
      } else {
        markerRef.current = L.marker(latLng).addTo(map);
      }
      map.setView(latLng, Math.max(map.getZoom(), 14));
    });
  }, [latitude, longitude, ready]);

  return (
    <div className={className}>
      <p className="mb-2 text-xs text-[#A1A6AA]">{t("churchGroups.mapPickerHint")}</p>
      <div className="relative">
        {!ready && !error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border border-input bg-muted/30 dark:border-white/10">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
          </div>
        )}
        {error && (
          <div className="mb-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {t("churchGroups.mapLoadError")}
          </div>
        )}
        <div
          ref={containerRef}
          className="church-map-host h-[220px] w-full overflow-hidden rounded-lg border border-input dark:border-white/10"
        />
      </div>
    </div>
  );
}
