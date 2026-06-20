export type FocusField = "subject" | "body";

export function insertVariableToken(
  value: string,
  token: string,
  selectionStart: number,
  selectionEnd: number
): { next: string; cursor: number } {
  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionEnd);
  const next = `${before}${token}${after}`;
  const cursor = selectionStart + token.length;
  return { next, cursor };
}

export function variablePlaceholder(key: string): string {
  return `{{${key}}}`;
}
