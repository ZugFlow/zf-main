
"use server";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export type LoginFormState = {
  error?: string;
  redirectTo?: string;
};

export const loginAction = async (formData: FormData): Promise<LoginFormState> => {
  const email = formData.get("email")?.toString().trim() || "";
  const password = formData.get("password")?.toString() || "";

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return { error: "Email o password errati." };
  }

  return { redirectTo: "/crm/dashboard" };
};

export const loginWithGoogle = async (): Promise<LoginFormState> => {
  const supabase = createClient();
  const { error, data } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URL || `${process.env.NEXT_PUBLIC_BASE_URL}/crm/dashboard`,
    },
  });
  if (error) {
    return { error: "Errore durante l'accesso con Google." };
  }
  // The redirect will be handled by Supabase, but we return a value for consistency
  return { redirectTo: "/crm/dashboard" };
};
