import { onMessage } from "webext-bridge/background";
import { supabase } from "./supabase";

// helpers
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
