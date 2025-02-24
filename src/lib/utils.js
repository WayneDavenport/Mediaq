import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const PROTECTED_CATEGORIES = ['tv', 'movie', 'game', 'book'];

export const validateCategory = (category) => {
  return !PROTECTED_CATEGORIES.includes(category.toLowerCase());
};
