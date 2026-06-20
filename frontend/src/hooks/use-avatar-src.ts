"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";

export function useAvatarSrc(avatarUrl?: string | null, enabled = true) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (!avatarUrl) {
      setSrc(null);
      return;
    }

    if (avatarUrl.startsWith("http") && !avatarUrl.includes("/profile/avatar")) {
      setSrc(avatarUrl);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { data } = await api.get("/v1/users/profile/avatar", {
          responseType: "blob",
        });
        if (cancelled) return;
        objectUrl = URL.createObjectURL(data);
        setSrc(objectUrl);
      } catch {
        if (!cancelled) setSrc(null);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [avatarUrl, enabled]);

  return src;
}

