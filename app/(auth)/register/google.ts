"use server";
import { createClient } from "@/utils/supabase/server";

export const registerWithGoogle = async () => {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URL || `${process.env.NEXT_PUBLIC_BASE_URL}/crm/dashboard`,
    },
  });
  if (error) {
    return { error: "Errore durante l'accesso con Google." };
  }
  // Il redirect viene gestito da Supabase
  return { success: true };
};
