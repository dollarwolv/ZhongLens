import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { sendMessage } from "webext-bridge/popup";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState([]);
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function sendResetLink() {
    setLoading(true);
    const res = await sendMessage(
      "AUTH_RESET_PASSWORD",
      { email: email },
      "background",
    );

    console.log(res);

    if (res.error) setErrors([res.error]);
    else {
      setEmailSent(true);
      setLoading(false);
    }
  }

  return (
    <div className="flex w-80 flex-col items-center gap-3 p-4">
      <Link to={"/"}>
        <Button className="fixed top-2 left-2 z-10 shadow" variant={"default"}>
          <ArrowLeft />
          Back
        </Button>
      </Link>
      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Reset your password</CardTitle>
            <CardDescription>
              Enter your email below to send a reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <>
                <Field>
                  <FieldLabel>
                    Email sent. Please check your inbox and follow the link to
                    reset your email.
                  </FieldLabel>
                </Field>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                      }}
                      required
                    />
                  </Field>
                  <Field>
                    <Button
                      type="submit"
                      onClick={async (e) => {
                        e.preventDefault;
                        await sendResetLink();
                      }}
                    >
                      {loading ? <Spinner /> : "Send reset email"}
                    </Button>
                  </Field>
                </FieldGroup>
                {errors && <FieldError errors={errors} />}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ForgotPassword;
