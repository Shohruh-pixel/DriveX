import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@shared/ui/Toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Данные кэшируются 5 минут
      staleTime: 5 * 60 * 1000,
      // Повтор при ошибке 2 раза
      retry: 2,
      // Не рефетчим при фокусе окна (экономим запросы)
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
}
