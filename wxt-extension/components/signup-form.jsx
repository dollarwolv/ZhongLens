import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Spinner } from "./ui/spinner";
import { Input } from "@/components/ui/input";
import { Link } from "react-router";
import { sendMessage } from "webext-bridge/popup";
import { useNavigate } from "react-router";

export function SignupForm({ ...props }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState([]);
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function createAccount() {
    if (password !== confirmPassword)
      setErrors([{ message: "Passwords don't match." }]);

    setLoading(true);
    const res = await sendMessage(
      "AUTH_SIGNUP",
      { email, password },
      "background",
    );
    if (!res?.ok) {
      setErrors([{ message: res?.error }]);
      console.log(res?.error);
    } else if (!res?.session) {
      setErrors([]);
      setEmailSent(true);
    } else {
      setErrors([]);
      navigate("/");
    }
    setLoading(false);
  }

  return (
    <>
      {emailSent ? (
        <Card {...props}>
          <CardHeader>
            <CardTitle className="text-xl">
              Confirmation email has been sent!
            </CardTitle>
            <CardDescription>
              Please check your inbox, click the link and log in with your
              credentials.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card {...props}>
          <CardHeader>
            <CardTitle className="text-xl">Create an account</CardTitle>
            <CardDescription>
              Enter your information below to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => e.preventDefault()}>
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
                  <FieldDescription>
                    We&apos;ll use this to contact you. We will not share your
                    email with anyone else.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                    }}
                  />
                  <FieldDescription>
                    Must be at least 8 characters long.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirm-password">
                    Confirm Password
                  </FieldLabel>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                    }}
                    required
                  />
                  <FieldDescription>
                    Please confirm your password.
                  </FieldDescription>
                </Field>
                <FieldGroup>
                  <Field>
                    <Button
                      type="submit"
                      onClick={async (e) => {
                        e.preventDefault;
                        await createAccount();
                      }}
                    >
                      {loading ? <Spinner /> : "Create Account"}
                    </Button>
                    <FieldDescription className="px-6 text-center">
                      Already have an account?{" "}
                      <Link to={"/login"}>Sign in</Link>
                    </FieldDescription>
                    {errors && <FieldError errors={errors} />}
                  </Field>
                </FieldGroup>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}
