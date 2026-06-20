import { api } from "./client";

export async function downloadAuthenticatedBlob(
  path: string,
  filename: string,
  mime = "text/html;charset=utf-8"
): Promise<void> {
  const { data } = await api.get<Blob>(path, { responseType: "blob" });
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
