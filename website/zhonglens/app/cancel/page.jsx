import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";

function PurchaseCanceled() {
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
              You have canceled your purchase session.
            </FieldLabel>
            <FieldDescription className={"flex flex-col text-center gap-1"}>
              <span>
                You have canceled your purchase session and were not charged.
                Encountered any issues? Please send me an email at
                dev@zhonglens.dev.
              </span>
            </FieldDescription>
          </Field>
        </CardContent>
      </Card>
    </main>
  );
}

export default PurchaseCanceled;
