import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";

function SignupSuccess() {
  return (
    <main className="w-screen h-screen flex justify-center items-center">
      <Card className={"w-120"}>
        <CardContent>
          <Field>
            <FieldLabel className={"text-2xl font-medium"}>
              Email Verification Successful.
            </FieldLabel>
            <FieldDescription>
              You can now close this tab, open the extension and sign in with
              your new password.
            </FieldDescription>
          </Field>
        </CardContent>
      </Card>
    </main>
  );
}

export default SignupSuccess;
