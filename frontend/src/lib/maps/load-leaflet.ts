/** Load Leaflet from CDN (avoids Webpack/Next module resolution issues in WSL). */

export type LeafletModule = typeof import("leaflet");

const LEAFLET_VERSION = "1.9.4";
const LEAFLET_BASE = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist`;

let loadPromise: Promise<LeafletModule> | null = null;

function ensureLeafletCss(): void {
  if (typeof document === "undefined") return;
  const id = "leaflet-css";
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `${LEAFLET_BASE}/leaflet.css`;
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
}

export function loadLeaflet(): Promise<LeafletModule> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Leaflet requires a browser environment"));
  }

  const w = window as Window & { L?: LeafletModule };
  if (w.L) return Promise.resolve(w.L);

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    ensureLeafletCss();

    const id = "leaflet-js";
    const existing = document.getElementById(id) as HTMLScriptElement | null;

    const finish = () => {
      if (w.L) resolve(w.L);
      else reject(new Error("Leaflet global L not found"));
    };

    if (existing) {
      if (w.L) {
        finish();
        return;
      }
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => reject(new Error("Leaflet script error")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = `${LEAFLET_BASE}/leaflet.js`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = finish;
    script.onerror = () => reject(new Error("Could not load Leaflet script"));
    document.body.appendChild(script);
  });

  return loadPromise;
}

export function configureLeafletIcons(L: LeafletModule): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: `${LEAFLET_BASE}/images/marker-icon-2x.png`,
    iconUrl: `${LEAFLET_BASE}/images/marker-icon.png`,
    shadowUrl: `${LEAFLET_BASE}/images/marker-shadow.png`,
  });
}

/** Recalculate map size after container becomes visible or resizes. */
export function refreshMapSize(map: import("leaflet").Map): void {
  requestAnimationFrame(() => {
    map.invalidateSize({ animate: false });
  });
}

export const DEFAULT_MAP_CENTER: [number, number] = [-32.889458, -68.845838];
export const DEFAULT_MAP_ZOOM = 13;
