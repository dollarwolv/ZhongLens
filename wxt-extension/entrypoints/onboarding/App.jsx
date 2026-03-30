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
      "ZhongLens lets you look up Chinese characters in any content. Here’s how to get the most out of it. It’ll take less than a minute. Listen up!",
    giphy:
      "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXE1bjJvcmE2M294YmllNHp4Z29nYjByOTYxNWthaWtwMmFlMjhzayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/vtFZ8O85q8g3MmXK51/giphy.gif",
    primary: "Continue",
  },
  {
    title: "Step 1: Install a pop-up dictionary",
    description: `If you haven't already, install a pop-up dictionary like Zhongwen from the Chrome web store. ZhongLens is compatible with any pop-up dictionary.`,
    giphy:
      "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExdXd6ZDV3ZDhqMWpnbmV1cmwwc2s3djNzZncxdzVhMXpycXd2cHRkciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/yzoPpoozF4bVZqgmgC/giphy.gif",
    primary: "Continue",
    secondary: "Back",
  },
  {
    title: "Step 2: Look up Chinese characters",
    description: `When you're watching any kind of content, press the key combination (by default: CTRL + O) to bring up the OCR overlay. 
    The characters will automatically be overlayed on the screen, and you can then hover over them to bring up the pop-up dictionary.
    Close the overlay with the key combination to keep watching (by default: CTRL + L).`,
    giphy:
      "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExc2xxbWE0cG10ZWJlMWt2MnF2bmJreTgxaHA5bHUxd2phc2NhaTYyMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/krOt8jWTJb1yfxp7NS/giphy.gif",
    primary: "Continue",
    secondary: "Back",
  },
  {
    title: "Customize ZhongLens",
    description: `To change your settings, just open the extensions panel click on the ZhongLens logo.
                  On this page, you can crop, switch OCR modes, toggle shortcuts, and become a supporter.`,
    giphy:
      "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExMG5lY2w5N2xuaXV3cTZyM3dpMThuMnd2eXM5ZHZ1Znc0NDE5amN0byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/jNC0cpPnXPU5ML9gRu/giphy.gif",
    primary: "Continue",
    secondary: "Back",
  },
  {
    title: "Get better results: Cropping",
    description: `The larger the scanned area is, the slower and noisier OCR gets.
                  Crop to your subtitle area for the best results (Ctrl + U to open, Ctrl + I to close).
                  You may need to re-crop if subtitles move or you switch into fullscreen.`,
    giphy:
      "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjh3aDNpZW5pZTJrbGJwZGpmMGFtdGVsdDQ0MDdnazFpNGRrdjdqdiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/X9PHcIbSjtWYXpF8Fg/giphy.gif",
    primary: "Continue",
    secondary: "Back",
  },
  {
    title: "Get better results: Cloud OCR",
    description: `ZhongLens offers two modes: Local and Cloud OCR.
                  Local runs in your browser. It’s fast, but less accurate.
                  Cloud runs on a private server. It’s slightly slower, but much more accurate.
                  Become a ZhongLens supporter to unlock unlimited Cloud OCR. 
                  Your screenshots are never stored.`,
    giphy:
      "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExOXlhdnptdGJrdHpuNWFrZWEwYTh1YzUyMTM2eXJpNng0Mmh3aTBvaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/No5qhP7otiFQaWuMQT/giphy.gif",
    primary: "Continue",
    secondary: "Back",
  },
  {
    title: "You're ready!",
    description:
      "You can now use ZhongLens! If you have any more questions, please refer to the FAQ or send me an email at dev@zhonglens.dev.",
    giphy:
      "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExajlqN2l0OXNtOXBtaXg4MHRjdHJmY3Y3cDc2a2Q1OXp6MXBucDY3YiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/75yYfqYy5tmHm/giphy.gif",
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
            <CardDescription className="text-base leading-6 whitespace-pre-line">
              {current.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {current.giphy && (
              <div className="overflow-hidden rounded-lg border">
                <img
                  src={current.giphy}
                  alt={`${current.title} illustration`}
                  className="max-h-100 w-full object-cover"
                />
              </div>
            )}

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
