import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";

function AccountPage() {
  return (
    <main className="w-screen h-screen flex justify-center items-center">
      <Card className={"w-120"}>
        <CardContent>
          <Field>
            <FieldLabel
              className={
                "text-2xl font-medium text-center w-full flex justify-center"
              }
            >
              You have closed the customer portal.
            </FieldLabel>
            <FieldDescription className={"flex flex-col text-center gap-1"}>
              <span>
                Want to get back to it? Just open the extension again and
                navigate to the profile section.
              </span>
            </FieldDescription>
          </Field>
        </CardContent>
      </Card>
    </main>
  );
}

export default AccountPage;
