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
import type { ChurchGroupMapPoint } from "@/lib/types/church-group";
import { useI18n } from "@/i18n";
import { Loader2 } from "lucide-react";

type ChurchGroupsMapProps = {
  groups: ChurchGroupMapPoint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
};

const defaultMapClass =
  "h-[min(70vh,560px)] min-h-[360px] w-full overflow-hidden rounded-xl border border-input dark:border-white/10";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function ChurchGroupsMap({
  groups,
  selectedId,
  onSelect,
  className,
}: ChurchGroupsMapProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  onSelectRef.current = onSelect;

  const mapClassName = className ?? defaultMapClass;

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
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
          maxZoom: 19,
        }).addTo(map);

        layerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        refreshMapSize(map);
        setReady(true);
      })
      .catch(() => setError(true));

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      layerRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    refreshMapSize(mapRef.current);
  }, [ready]);

  useEffect(() => {
    if (!ready) return;

    void loadLeaflet().then((L) => {
      const map = mapRef.current;
      const layer = layerRef.current;
      if (!map || !layer) return;

      layer.clearLayers();

      if (groups.length === 0) {
        map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);
        refreshMapSize(map);
        return;
      }

      const bounds = L.latLngBounds([]);

      for (const group of groups) {
        if (group.latitude == null || group.longitude == null) continue;

        const latLng = L.latLng(group.latitude, group.longitude);
        bounds.extend(latLng);

        const lines = [
          `<strong>${escapeHtml(group.name)}</strong>`,
          group.leader_name ? escapeHtml(group.leader_name) : "",
          [group.meeting_day, group.meeting_time].filter(Boolean).join(" · "),
          [group.address_line, group.city].filter(Boolean).join(", "),
        ].filter(Boolean);

        const marker = L.marker(latLng);
        marker.bindPopup(lines.join("<br/>"));
        marker.on("click", () => onSelectRef.current?.(group.id));
        marker.addTo(layer);

        if (selectedId === group.id) {
          marker.openPopup();
        }
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.15), { maxZoom: 15 });
      }
      refreshMapSize(map);
    });
  }, [groups, selectedId, ready]);

  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const group = groups.find((g) => g.id === selectedId);
    if (!group?.latitude || !group?.longitude) return;
    mapRef.current.setView([group.latitude, group.longitude], 15, { animate: true });
  }, [selectedId, groups]);

  return (
    <div className={`relative ${mapClassName}`}>
      {!ready && !error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-muted/40">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-center text-sm text-destructive">
          {t("churchGroups.mapLoadError")}
        </div>
      )}
      <div ref={containerRef} className="church-map-host h-full w-full" />
    </div>
  );
}
