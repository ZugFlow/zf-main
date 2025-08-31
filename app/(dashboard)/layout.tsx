'use client';

import { AuthProvider } from "./(private)/crm/dashboard/query/AuthContext";
import { NotificationProvider } from "@/components/ui/carbon-notification";
import { LocalizationProvider } from "@/hooks/useLocalization";
import ChatGlobalNotifications from "@/components/chat/ChatGlobalNotifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocalizationProvider>
          <NotificationProvider maxNotifications={5}>
            <ChatGlobalNotifications />
            {children}
          </NotificationProvider>
        </LocalizationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
