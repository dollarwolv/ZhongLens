import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
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
import { getCopywritingSection } from "@/lib/copywriting";

export default function FAQ() {
  const [faqContent, setFaqContent] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadFaqContent() {
      try {
        const content = await getCopywritingSection("faq");
        if (!mounted) return;
        setFaqContent(content);
      } catch (err) {
        if (!mounted) return;
        setError(err.message);
      }
    }

    loadFaqContent();

    return () => {
      mounted = false;
    };
  }, []);

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
          <CardTitle className="text-2xl">{faqContent?.title || ""}</CardTitle>
          <CardDescription>
            {faqContent?.description || "Loading FAQ..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-destructive text-sm">{error}</div>
          ) : (
            <Accordion
              type="single"
              collapsible
              className="rounded-lg border px-3"
            >
              {(faqContent?.items || []).map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-6">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
