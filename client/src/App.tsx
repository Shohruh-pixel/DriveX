import React, { useEffect } from "react";
import { Providers } from "./app/providers";
import { AppRouter } from "./app/router";
import { useAuthStore } from "@features/auth/store";

export function App() {
  useEffect(() => {
    const { session, syncFromSupabase } = useAuthStore.getState();
    if (session.authenticated) {
      syncFromSupabase().catch(console.error);
    }
  }, []);

  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
}
