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

  onMessage("AUTH_SIGNUP", async ({ data: { email, password } }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: "https://zhonglens.dev/auth/signup/success",
        },
      });
      if (error) throw error;
      return { ok: true, user: data.user, session: data.session };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  });

  onMessage("AUTH_GET_SESSION", async () => {
    try {
      const { data } = await supabase.auth.getSession();
      console.log(data);
      if (!data?.session) {
        throw new Error("no session found.");
      }
      return { ok: true, session: data.session };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  });

  onMessage("AUTH_UPDATE_USER", async ({ data: { email, password } }) => {
    const updates = {};

    if (email) updates.email = email;
    if (password) updates.password = password;

    try {
      const { data, error } = await supabase.auth.updateUser(updates);
      console.log(data, "data");
      console.log(error, "error");
      if (error) throw error;
      return { ok: true, user: data.user };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  });

  onMessage("AUTH_RESET_PASSWORD", async ({ data: { email } }) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://zhonglens.dev/auth/reset-password",
      });
      console.log(data, "data");
      console.log(error, "error");
      if (error) throw error;
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  });

  onMessage("AUTH_SIGN_OUT", async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  });
}
