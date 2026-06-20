/**
 * Texto plano seguro para textareas/inputs: sin HTML ni patrones típicos de script.
 */
export function sanitizePlainText(value: string): string {
  let s = value.replace(/\0/g, "");

  s = s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  s = s.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  s = s.replace(/<[^>]+>/g, "");
  s = s.replace(/javascript\s*:/gi, "");
  s = s.replace(/data\s*:\s*text\/html/gi, "");
  s = s.replace(/\bon\w+\s*=/gi, "");

  return s;
}

export function clampText(value: string, maxLength: number): string {
  return sanitizePlainText(value).slice(0, maxLength);
}

export function prepareTextareaChange(value: string, maxLength: number): string {
  return clampText(value, maxLength);
}
