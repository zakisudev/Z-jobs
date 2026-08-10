/**
 * FormData values are `string | File`. Calling String() on one blindly yields
 * "[object Object]" for a File, which then silently passes validation as a
 * non-empty string. This narrows properly.
 */
export function formValue(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === "string" ? value : "";
}

export function formChecked(data: FormData, key: string): boolean {
  return data.get(key) === "on" || data.get(key) === "true";
}
