import { createClient } from "@supabase/supabase-js";
import { onMessage } from "webext-bridge/background";

// helpers
const chromeStorageAdapter = {
  getItem: async (key) => {
    return new Promise((resolve) => {
      // Use chrome.storage.local.get to retrieve the item
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] ?? null);
      });
    });
  },
  setItem: async (key, value) => {
    return new Promise((resolve, reject) => {
      // Use chrome.storage.local.set to store the item
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  },
  removeItem: async (key) => {
    return new Promise((resolve) => {
      // Use chrome.storage.local.remove to remove the item
      chrome.storage.local.remove([key], resolve);
    });
  },
};

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  {
    auth: {
      storage: chromeStorageAdapter, // Use the custom adapter
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);

export function initAuthHandlers() {
  onMessage("AUTH_LOGIN", async ({ data: { email, password } }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { ok: true, user: data.user };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  });
}
