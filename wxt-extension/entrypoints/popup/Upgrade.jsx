import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowLeft, HandFist } from "lucide-react";
import { Link } from "react-router";

function Upgrade() {
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
      <div className="flex flex-row gap-8 py-8">
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
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold">$3.99</span>
              <div className="flex flex-col text-sm">
                <span className="font-bold">per month</span>
                <span className="font-light">plus VAT</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button className="w-full">Get started</Button>
            <ul className="flex flex-col gap-2 text-base">
              <li className="flex flex-row items-center gap-1">
                <Check height={16} />
                Unlimited Cloud Usage
              </li>
              <li className="flex flex-row items-center gap-1">
                <Check height={16} />
                Supports the Project
              </li>
              <li className="flex flex-row items-center gap-1">
                <Check height={16} />
                Dev Settings for full control
              </li>
              <li className="flex flex-row items-center gap-1">
                <Check height={16} />
                Priority Support
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Upgrade;
