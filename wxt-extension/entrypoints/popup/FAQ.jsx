import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FAQ_CONTENT = {
  title: "ZhongLens FAQ",
  description:
    "Quick answers about scanning, hovering, and getting the most out of ZhongLens.",
  items: [
    {
      id: "scan-page",
      question: "How do I scan the page I’m looking at?",
      answer: `Use the shortcut to quickly scan the page (default: CTRL+O to open, CTRL+L to close). 
               You can customize this shortcut in the settings. Alternatively, open the ZhongLens popup and click Capture Tab. 
               ZhongLens will analyze the current tab so you can hover over detected Chinese text.`,
    },
    {
      id: "hover-results",
      question: "How do I see translations or lookup information?",
      answer: `Make sure to install a pop-up dictionary such as Zhongwen in your browser before using ZhongLens. 
        After a scan finishes, move your cursor over highlighted text on the page.`,
    },
    {
      id: "best-results",
      question: "How do I get the best results possible?",
      answer: `To get the best results possible, use Cloud OCR for more accurate processing and Crop mode to reduce the time it takes to scan the page.`,
    },
    {
      id: "crop-mode",
      question: "What does Crop mode do?",
      answer: `Crop mode lets you select a smaller region before running OCR. By cropping, the OCR model has to scan less pixels, which makes it significantly faster.
               That's why it is always recommended to use Crop mode.`,
    },
    {
      id: "local-vs-cloud",
      question: "What’s the difference between Local and Cloud OCR?",
      answer: `Local OCR uses a smaller model (Tesseract.js), so it runs directly on your device. It’s fast and lightweight, but less accurate.
               Cloud OCR uses a larger model (PaddleOCR), which is significantly more accurate. 
               However, it’s too resource-intensive to run in a browser, so it runs on a server instead.
               Since running this model incurs ongoing costs, unlimited Cloud OCR is only available to supporters.`,
    },
    {
      id: "account",
      question: "Do I need an account to use ZhongLens?",
      answer: `You do not need an account to use ZhongLens. However, a free account is required to use Cloud OCR in order to enforce usage limits.`,
    },
    {
      id: "data-stored",
      question: "Do you store any screenshot data?",
      answer: `Privacy is of utmost importance to us. We don't store any of your screenshot/OCR data.`,
    },
    {
      id: "found-bug",
      question: "I found a bug. How do I report it?",
      answer: `Please send me an email at dev@zhonglens.dev. I will do my best to fix all bugs immediately.`,
    },
  ],
};

export default function FAQ() {
  return (
    <div className="flex w-120 flex-col gap-3 p-4">
      <Button asChild variant="ghost" size="sm" className="w-fit px-2">
        <Link to="/">
          <ArrowLeft />
          Back
        </Link>
      </Button>

      <Card className="shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">{FAQ_CONTENT.title}</CardTitle>
          <CardDescription>{FAQ_CONTENT.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion
            type="single"
            collapsible
            className="rounded-lg border px-3"
          >
            {FAQ_CONTENT.items.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-6">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
