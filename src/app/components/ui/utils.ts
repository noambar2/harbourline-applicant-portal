import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// "Glass" style - semi-transparent background that blurs the colourful background behind it
export const GLASS_CARD =
  "bg-white/30 backdrop-blur-lg border border-white/50 shadow-[0_8px_32px_rgba(18,39,54,0.12)]";
