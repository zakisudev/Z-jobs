import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names and resolves Tailwind conflicts so a later class wins
 * (`cn("p-2", "p-4")` -> `"p-4"`). Every component composes classes through
 * this rather than concatenating strings.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
