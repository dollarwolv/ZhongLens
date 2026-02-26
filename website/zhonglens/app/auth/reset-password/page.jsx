"use client";

import { createClient } from "@/utils/supabase/client";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { redirect } from "next/navigation";

function ForgotPassword() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) alert(error.message);
    else redirect("/auth/reset-password/success");
  }

  useEffect(() => {
    const hash = window.location.hash.substring(1); // remove "#"
    const params = new URLSearchParams(hash);

    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (access_token && refresh_token) {
      try {
        const { error } = supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (error) throw error;
      } catch (error) {
        setError(error.message);
      }
    }
  }, [supabase]);

  return (
    <main className="w-screen h-screen flex justify-center items-center">
      <Card className={"w-120"}>
        <CardContent>
          <Field>
            <FieldLabel className={"text-2xl font-medium"}>
              Set a new password
            </FieldLabel>
            <FieldDescription>
              Must be at least 8 characters long.
            </FieldDescription>
            <Input
              id="password"
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button onClick={(e) => onSubmit(e)}>Update password</Button>
          </Field>
        </CardContent>
      </Card>
    </main>
  );
}

export default ForgotPassword;
