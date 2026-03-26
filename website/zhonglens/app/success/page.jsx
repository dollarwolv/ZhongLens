import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";

function SubscriptionSuccess() {
  return (
    <main className="w-screen h-screen flex justify-center items-center">
      <Card className={"w-120"}>
        <CardContent>
          <Field>
            <FieldLabel className={"text-2xl font-medium text-center"}>
              You have successfully become a ZhongLens supporter.
            </FieldLabel>
            <FieldDescription className={"flex flex-col text-center gap-1"}>
              <span>Thank you! ❤️</span>
              <span>
                Please open the Profile section in the extension to check your
                membership status or cancel/edit your subscription. Encountered
                an issue? Please contact me at dev@zhonglens.dev.
              </span>
            </FieldDescription>
          </Field>
        </CardContent>
      </Card>
    </main>
  );
}

export default SubscriptionSuccess;
