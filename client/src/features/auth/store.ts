import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthSession, Car, UserRole } from "@shared/api/types";
import { getSupabase, isSupabaseConfigured } from "@shared/api/supabase";
import { loadUserLocal, saveUserLocal } from "@shared/api/dataLayer";
import { saveCarToSupabase } from "../auth/api";

const EMPTY_SESSION: AuthSession = {
  id: "",
  name: "",
  phone: "",
  email: "",
  role: "buyer",
  authenticated: false,
  provider: "guest",
};

interface AuthStore {
  session: AuthSession;
  cars: Car[];
  activeCarId: string;

  // Actions
  setSession: (session: AuthSession) => void;
  setCars: (cars: Car[]) => void;
  addCar: (car: Car) => void;
  setActiveCarId: (id: string) => void;
  logout: () => void;

  // Загрузить данные из Supabase (после входа)
  syncFromSupabase: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      session: EMPTY_SESSION,
      cars: [],
      activeCarId: "",

      setSession: (session) => {
        set({ session });
        saveUserLocal("session", session);
      },

      setCars: (cars) => {
        set({ cars });
        saveUserLocal("cars", cars);
      },

      addCar: (car) => {
        const next = [car, ...get().cars.filter((c) => c.id !== car.id)];
        set({ cars: next, activeCarId: car.id });
        saveUserLocal("cars", next);
        const { id } = get().session;
        if (id) saveCarToSupabase(id, next).catch(console.error);
      },

      setActiveCarId: (id) => {
        set({ activeCarId: id });
        saveUserLocal("activeCarId", id);
        const userId = get().session.id;
        if (userId) {
          getSupabase()
            .from("users")
            .update({ active_car_id: id })
            .eq("id", userId)
            .then(() => {}, console.error);
        }
      },

      logout: async () => {
        if (isSupabaseConfigured) {
          await getSupabase().auth.signOut().catch(() => {});
        }
        set({ session: EMPTY_SESSION, cars: [], activeCarId: "" });
        // Очищаем только auth данные, не весь localStorage
        ["session", "cars", "activeCarId"].forEach((k) => {
          try { localStorage.removeItem(`drivex.user.${k}`); } catch {}
        });
      },

      syncFromSupabase: async () => {
        if (!isSupabaseConfigured) return;
        const sb = getSupabase();
        const { data: { user } } = await sb.auth.getUser().catch(() => ({ data: { user: null } }));
        if (!user) return;

        // Загружаем профиль из public.users
        const { data: profile } = await sb
          .from("users")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          const session: AuthSession = {
            id: user.id,
            name: profile.full_name || user.user_metadata?.full_name || "",
            phone: profile.phone || user.user_metadata?.phone || user.phone || "",
            email: user.email || "",
            role: (profile.role as UserRole) || "buyer",
            authenticated: true,
            provider: "supabase",
          };
          set({ session });

          // Загружаем машины
          if (Array.isArray(profile.cars) && profile.cars.length > 0) {
            set({ cars: profile.cars, activeCarId: profile.active_car_id || profile.cars[0]?.id || "" });
          }
        }
      },
    }),
    {
      name: "drivex-auth",
      // Храним только нужные поля
      partialize: (state) => ({
        session: state.session,
        cars: state.cars,
        activeCarId: state.activeCarId,
      }),
    }
  )
);

// Хук для проверки роли
export function useIsRole(role: UserRole | UserRole[]) {
  const session = useAuthStore((s) => s.session);
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(session.role);
}

export function useIsAuthenticated() {
  return useAuthStore((s) => s.session.authenticated);
}
