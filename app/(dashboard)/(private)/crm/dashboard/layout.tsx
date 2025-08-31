// app/(public)/(home)/layout.tsx


import { createClient } from "@/utils/supabase/server";
import { Toaster } from "@/components/ui/sonner";



export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseClient = createClient();
  const { data } = await supabaseClient.auth.getUser();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Area del contenuto */}
      <div className="flex-1 overflow-y-auto">{children}</div>
      
      {/* Toaster e Footer */}
      <Toaster />
    </div>
  );
}

