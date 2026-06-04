// app/core/supabase.js — Supabase client, buyer session, localStorage helpers
(() => {
  'use strict';
  const DX = window.DX;
  const drivexStorageKeys = DX.drivexStorageKeys;
  const buyerPersonalStorageKeys = DX.buyerPersonalStorageKeys;

  function createEmptyBuyerSession() {
    return {
      id: "",
      name: "",
      phone: "",
      email: "",
      role: "buyer",
      provider: "local",
      authenticated: false
    };
  }

  function normalizeBuyerSession(value) {
    const fallback = createEmptyBuyerSession();
    const source = value && typeof value === "object" ? value : {};
    const id = typeof source.id === "string" && source.id.trim() ? source.id.trim() : "";
    const email = typeof source.email === "string" ? source.email.trim().toLowerCase() : "";
    const phone = typeof source.phone === "string" ? source.phone.trim() : "";
    const name = typeof source.name === "string" ? source.name.trim() : "";

    // Сохраняем роль если это seller/partner/admin, иначе buyer
    const rawRole = typeof source.role === "string" ? source.role.trim() : "";
    const role = (rawRole === "seller" || rawRole === "partner" || rawRole === "admin")
      ? rawRole
      : "buyer";

    return {
      id,
      name,
      phone,
      email,
      role,
      provider: source.provider === "supabase" ? "supabase" : "local",
      authenticated: Boolean(source.authenticated && (id || email || phone))
    };
  }

  function normalizeBuyerProfile(value) {
    const fallback = createDefaultBuyerProfile();
    const source = value && typeof value === "object" ? value : {};
    const avatarRaw = typeof source.avatar === "string" ? source.avatar.trim() : "";

    let avatar = "";
    if (avatarRaw) {
      if (avatarRaw.startsWith("https://") || avatarRaw.startsWith("http://")) {
        avatar = avatarRaw;
      } else if (avatarRaw.startsWith("data:image/") && avatarRaw.length <= 500000) {
        avatar = avatarRaw;
      }
    }

    return {
      name: String(source.name || fallback.name).trim() || fallback.name,
      phone: String(source.phone || "").trim(),
      email: String(source.email || "").trim().toLowerCase(),
      avatar
    };
  }

  function buyerSessionToProfile(session, currentProfile) {
    const safeSession = normalizeBuyerSession(session);
    const safeProfile = normalizeBuyerProfile(currentProfile);

    return normalizeBuyerProfile({
      ...safeProfile,
      name: safeSession.name || safeProfile.name,
      phone: safeSession.phone || safeProfile.phone,
      email: safeSession.email || safeProfile.email
    });
  }

  function getSupabaseClient() {
    if (!window.supabase || typeof window.supabase.createClient !== "function") return null;
    const config = window.DRIVEX_SUPABASE_CONFIG || {};
    if (!config.url || !config.anonKey) return null;

    if (!window.__DRIVEX_SUPABASE_CLIENT__) {
      window.__DRIVEX_SUPABASE_CLIENT__ = window.supabase.createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "drivex-auth"  // единый ключ — предотвращает Lock conflicts
        }
      });
    }

    return window.__DRIVEX_SUPABASE_CLIENT__;
  }

  function getBuyerAuthStatus() {
    return {
      mode: getSupabaseClient() ? "supabase" : "local",
      configured: Boolean(getSupabaseClient())
    };
  }

  function getBuyerLocalStorageKey(key, session) {
    const safeSession = normalizeBuyerSession(session);
    if (safeSession.authenticated && safeSession.id) {
      return `${key}#buyer:${safeSession.id}`;
    }
    return key;
  }

  function readBuyerLocalStorage(key, session) {
    try {
      const storageKey = getBuyerLocalStorageKey(key, session);
      const raw = window.localStorage ? window.localStorage.getItem(storageKey) : null;
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function writeBuyerLocalStorage(key, value, session) {
    try {
      const storageKey = getBuyerLocalStorageKey(key, session);
      if (value === null) {
        window.localStorage.removeItem(storageKey);
      } else {
        window.localStorage.setItem(storageKey, JSON.stringify(value));
      }
    } catch {
      // ignore storage errors
    }
  }

  function clearBuyerLocalStorageForSession(session) {
    try {
      if (!window.localStorage) return;
      const safeSession = normalizeBuyerSession(session);
      if (!safeSession.authenticated || !safeSession.id) return;
      for (const key of buyerPersonalStorageKeys) {
        const storageKey = getBuyerLocalStorageKey(key, safeSession);
        window.localStorage.removeItem(storageKey);
      }
    } catch {
      // ignore cleanup errors
    }
  }

  function readLocalBuyerUsers() {
    try {
      const raw = window.localStorage ? window.localStorage.getItem(drivexStorageKeys.buyerUsers) : null;
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item === "object") : [];
    } catch {
      return [];
    }
  }

  function writeLocalBuyerUsers(users) {
    try {
      window.localStorage &&
        window.localStorage.setItem(drivexStorageKeys.buyerUsers, JSON.stringify(Array.isArray(users) ? users : []));
    } catch {
      // ignore local auth cache errors
    }
  }

  function makeBuyerId(seed = Date.now()) {
    return `buyer-${String(seed).replace(/\D/g, "").slice(-10) || "new"}`;
  }

  function makeBuyerSessionFromLocalUser(user) {
    const safeUser = user && typeof user === "object" ? user : {};
    return normalizeBuyerSession({
      id: safeUser.id || makeBuyerId(),
      name: safeUser.name || "",
      phone: safeUser.phone || "",
      email: safeUser.email || "",
      role: safeUser.role || "buyer",  // сохраняем роль пользователя
      provider: "local",
      authenticated: true
    });
  }

  function makeBuyerSessionFromSupabaseUser(user) {
    const metadata = user?.user_metadata && typeof user.user_metadata === "object" ? user.user_metadata : {};
    // Читаем роль из user_metadata — продавец/партнёр не должны получать роль buyer
    const metaRole = metadata.role || "";
    const role = (metaRole === "seller" || metaRole === "partner" || metaRole === "admin")
      ? metaRole
      : "buyer";
    return normalizeBuyerSession({
      id: user?.id || "",
      name: metadata.full_name || metadata.name || "",
      phone: metadata.phone || user?.phone || "",
      email: user?.email || "",
      role,
      provider: "supabase",
      authenticated: Boolean(user?.id)
    });
  }

  // ── Supabase Profile Sync ─────────────────────────────────────────

  async function fetchProfileFromSupabase(session) {
    const client = getSupabaseClient();
    if (!client) return null;
    const safeSession = normalizeBuyerSession(session);
    if (!safeSession.authenticated || !safeSession.id || safeSession.provider !== "supabase") return null;

    try {
      const { data, error } = await client
        .from("users")
        .select("full_name, phone, email, avatar_url")
        .eq("id", safeSession.id)
        .single();

      if (error || !data) return null;

      return {
        name: data.full_name || "",
        phone: data.phone || "",
        email: data.email || "",
        avatar: data.avatar_url || ""
      };
    } catch {
      return null;
    }
  }

  async function syncProfileToSupabase(session, profile) {
    const client = getSupabaseClient();
    if (!client) return false;
    const safeSession = normalizeBuyerSession(session);
    if (!safeSession.authenticated || !safeSession.id || safeSession.provider !== "supabase") return false;
    if (!profile || typeof profile !== "object") return false;

    try {
      const update = {
        full_name: String(profile.name || "").trim(),
        phone: String(profile.phone || "").trim(),
        email: String(profile.email || "").trim().toLowerCase(),
        updated_at: new Date().toISOString()
      };
      if (profile.avatar && (profile.avatar.startsWith("https://") || profile.avatar.startsWith("http://"))) {
        update.avatar_url = profile.avatar;
      }

      const { error } = await client
        .from("users")
        .update(update)
        .eq("id", safeSession.id);

      return !error;
    } catch {
      return false;
    }
  }

  async function uploadAvatarToStorage(session, dataUrl) {
    const client = getSupabaseClient();
    if (!client) return null;
    const safeSession = normalizeBuyerSession(session);
    if (!safeSession.authenticated || !safeSession.id || safeSession.provider !== "supabase") return null;
    if (!dataUrl || !dataUrl.startsWith("data:image/")) return null;

    try {
      const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) return null;
      const mimeType = match[1];
      const base64Data = match[2];
      const ext = mimeType === "image/png" ? "png" : "jpg";

      const byteChars = atob(base64Data);
      const byteArr = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteArr[i] = byteChars.charCodeAt(i);
      }
      const blob = new Blob([byteArr], { type: mimeType });

      const filePath = `${safeSession.id}/avatar.${ext}`;
      const { error: uploadError } = await client.storage
        .from("avatars")
        .upload(filePath, blob, { upsert: true, contentType: mimeType });

      if (uploadError) return null;

      const { data: urlData } = client.storage.from("avatars").getPublicUrl(filePath);
      return urlData?.publicUrl || null;
    } catch {
      return null;
    }
  }

  // Export to DX namespace
  DX.createEmptyBuyerSession = createEmptyBuyerSession;
  DX.normalizeBuyerSession = normalizeBuyerSession;
  DX.normalizeBuyerProfile = normalizeBuyerProfile;
  DX.buyerSessionToProfile = buyerSessionToProfile;
  DX.createDefaultBuyerProfile = createDefaultBuyerProfile;
  DX.getSupabaseClient = getSupabaseClient;
  DX.getBuyerAuthStatus = getBuyerAuthStatus;
  DX.getBuyerLocalStorageKey = getBuyerLocalStorageKey;
  DX.readBuyerLocalStorage = readBuyerLocalStorage;
  DX.writeBuyerLocalStorage = writeBuyerLocalStorage;
  DX.clearBuyerLocalStorageForSession = clearBuyerLocalStorageForSession;
  DX.readLocalBuyerUsers = readLocalBuyerUsers;
  DX.writeLocalBuyerUsers = writeLocalBuyerUsers;
  DX.makeBuyerId = makeBuyerId;
  DX.makeBuyerSessionFromLocalUser = makeBuyerSessionFromLocalUser;
  DX.makeBuyerSessionFromSupabaseUser = makeBuyerSessionFromSupabaseUser;
  DX.fetchProfileFromSupabase = fetchProfileFromSupabase;
  DX.syncProfileToSupabase = syncProfileToSupabase;
  DX.uploadAvatarToStorage = uploadAvatarToStorage;
})();
