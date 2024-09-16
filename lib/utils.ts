import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function generateSixDigitCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function generatePlaceholderName(email: string): Promise<string> {
  // Get the part of the email before the '@'
  const username = email.split("@")[0];

  const placeholderName = username
    .split(/[^a-zA-Z0-9]/) // Split by any non-alphanumeric characters
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1)) // Capitalize first letter
    .join(" "); // Join the parts with spaces

  return placeholderName;
}
