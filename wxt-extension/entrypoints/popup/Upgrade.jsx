import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { Check, ArrowLeft } from "lucide-react";
import { Link } from "react-router";

import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { sendMessage } from "webext-bridge/popup";

function Upgrade() {
  const [supporterBilling, setSupporterBilling] = useState("monthly"); // "monthly" | "lifetime"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supporter =
    supporterBilling === "monthly"
      ? {
          price: "$2.99",
          sub: ["per month", "plus VAT"],
          desc: "Support ongoing development and unlock unlimited cloud usage and extra customization.",
          cta: "Start monthly",
          perks: [
            "Unlimited Cloud Usage",
            "Supports the Project",
            "Dev Settings for full control",
            "Priority Support",
          ],
        }
      : {
          price: "$27.99",
          sub: ["one time", "plus VAT"],
          desc: "One-time support. Keep premium access and help sustain ZhongLens long-term.",
          cta: "Get lifetime access",
          perks: [
            "Lifetime premium access",
            "Unlimited Cloud Usage",
            "Supports the Project",
            "Dev Settings for full control",
            "Priority Support",
          ],
        };

  async function initiateCheckout() {
    setLoading(true);
    // get access token from background
    const sessionRes = await sendMessage("AUTH_GET_SESSION", {}, "background");
    const accessToken = sessionRes?.session?.access_token;

    // start stripe checkout session
    const res = await sendMessage(
      "STRIPE_START_CHECKOUT_SESSION",
      { type: supporterBilling, accessToken: accessToken },
      "background",
    );

    // error if not ok
    if (!res?.ok) {
      setError(
        res?.error ||
          "There was an error creating your checkout session. Please try again later.",
      );
    } else {
      // if res ok, create new tab
      chrome.tabs.create({ url: res.stripeUrl });
    }
    setLoading(false);
  }
  return (
    <div className="relative flex w-160 flex-col items-center p-4">
      <Link to={"/"}>
        <Button className="fixed top-2 left-2 z-10 shadow" variant={"default"}>
          <ArrowLeft />
          Back
        </Button>
      </Link>
      <div className="mt-6 flex flex-col gap-2">
        <h1 className="text-foreground text-center text-5xl font-bold">
          Become a Supporter
        </h1>
        <p className="max-w-[55ch] text-center text-base">
          Learning Chinese is hard enough. ZhongLens is an independent project
          built to remove some of that friction. By upgrading, you support
          ongoing development and unlock more accurate OCR and additional
          customization.
        </p>
      </div>
      <div className="flex flex-col items-center gap-2.5 py-5">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={supporterBilling}
          onValueChange={(value) => {
            if (!value) return;
            setSupporterBilling(value);
          }}
          className=""
        >
          <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
          <ToggleGroupItem value="lifetime">Lifetime</ToggleGroupItem>
        </ToggleGroup>
        <div className="flex flex-row gap-8">
          <Card className="w-70 gap-2">
            <CardHeader>
              <CardTitle className="text-xl">ZhongLens Standard</CardTitle>
              <CardDescription>
                Get started with unlimited local OCR and a set number of cloud
                scans per month.
              </CardDescription>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-bold">Free</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button variant={"secondary"} className="w-full">
                Current plan
              </Button>
              <ul className="flex flex-col gap-2 text-base">
                <li className="flex flex-row items-center gap-1">
                  <Check height={16} />
                  Unlimited Local Scans
                </li>
                <li className="flex flex-row items-center gap-1">
                  <Check height={16} />
                  50 Cloud Scans per month
                </li>
                <li className="flex flex-row items-center gap-1">
                  <Check height={16} />
                  Standard settings
                </li>
              </ul>
            </CardContent>
          </Card>
          <Card className="w-70 gap-2">
            <CardHeader>
              <CardTitle className="text-xl">ZhongLens Supporter</CardTitle>
              <CardDescription>
                Support the cause and get unlimited cloud usage and additional
                customization options.
              </CardDescription>
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-col gap-1">
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-bold">
                      {supporter.price}
                    </span>
                    <div className="flex flex-col text-sm">
                      <span className="font-bold">{supporter.sub[0]}</span>
                      <span className="font-light">{supporter.sub[1]}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button className="w-full" onClick={initiateCheckout}>
                {loading ? <Spinner /> : "Get started"}
              </Button>
              {error && <span className="text-red-500">{error}</span>}
              <ul className="flex flex-col gap-2 text-base">
                {supporter.perks.map((item) => {
                  return (
                    <li className="flex flex-row items-center gap-1" key={item}>
                      <Check height={16} />
                      {item}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Upgrade;
