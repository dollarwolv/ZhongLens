import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCopywritingSection } from "@/lib/copywriting";

export default function App() {
  const [step, setStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadOnboardingSteps() {
      try {
        const content = await getCopywritingSection("onboarding");
        if (!mounted) return;
        setSteps(content?.steps || []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message);
      }
    }

    loadOnboardingSteps();

    return () => {
      mounted = false;
    };
  }, []);

  const current = steps[step];
  const isLastStep = step === steps.length - 1;

  const finishOnboarding = async () => {
    await chrome.storage.sync.set({ hasCompletedOnboarding: true });
    window.close();
  };

  const handlePrimary = async () => {
    if (isLastStep) {
      await finishOnboarding();
      return;
    }

    setStep((prev) => prev + 1);
  };

  const handleSecondary = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <main className="bg-background text-foreground min-h-screen p-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-2xl items-center justify-center">
        <Card className="w-full shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">
              {current?.title || "Loading..."}
            </CardTitle>
            <CardDescription className="text-base leading-6 whitespace-pre-line">
              {error || current?.description || ""}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {current?.giphy && (
              <div className="overflow-hidden rounded-lg border">
                <img
                  src={current.giphy}
                  alt={`${current.title} illustration`}
                  className="max-h-100 w-full object-cover"
                />
              </div>
            )}

            <div className="text-muted-foreground text-sm">
              {steps.length > 0 ? `Step ${step + 1} of ${steps.length}` : ""}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between gap-3">
            <div>
              {current?.secondary && (
                <Button variant="outline" onClick={handleSecondary}>
                  {current.secondary}
                </Button>
              )}
            </div>

            <Button onClick={handlePrimary} disabled={!current}>
              {current?.primary || "Loading..."}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
