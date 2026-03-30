import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STEPS = [
  {
    title: "Welcome to ZhongLens",
    description:
      "Capture Chinese text on any page and hover to look things up fast.",
    primary: "Continue",
  },
  {
    title: "How it works",
    description:
      "Open the popup, capture the current tab, then hover over detected text.",
    primary: "Continue",
    secondary: "Back",
  },
  {
    title: "You’re ready",
    description: "You can finish now and start using ZhongLens.",
    primary: "Finish",
    secondary: "Back",
  },
];

export default function App() {
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

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
            <CardTitle className="text-2xl">{current.title}</CardTitle>
            <CardDescription className="text-sm leading-6">
              {current.description}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="text-muted-foreground text-sm">
              Step {step + 1} of {STEPS.length}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between gap-3">
            <div>
              {current.secondary && (
                <Button variant="outline" onClick={handleSecondary}>
                  {current.secondary}
                </Button>
              )}
            </div>

            <Button onClick={handlePrimary}>{current.primary}</Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
