import { z } from "zod";

const requiredString = z.string().trim().min(1, "Required");

export const signUpSchema = z.object({
  email: requiredString.email("Invalid email address"),
  password: requiredString.min(8, "Must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: requiredString.email("Invalid email address"),
  password: requiredString,
});

export type SignUpValues = z.infer<typeof signUpSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
