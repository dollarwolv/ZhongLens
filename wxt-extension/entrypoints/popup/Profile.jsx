import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  ItemGroup,
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Mail,
  Crown,
  KeyRound,
  ScanEye,
  CircleArrowUp,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

function Profile() {
  const [scansUsed, setScansUsed] = useState(25);

  return (
    <div className="relative flex w-100 flex-col items-center gap-10 p-4">
      <Link to={"/"}>
        <Button className="fixed top-2 left-2 z-10 shadow" variant={"default"}>
          <ArrowLeft />
          Back
        </Button>
      </Link>
      <div className="flex w-full flex-col items-center gap-2">
        <h1 className="text-3xl font-semibold">Account</h1>
        <ItemGroup className="w-full">
          <Item className="w-full">
            <ItemMedia variant={"icon"}>
              <Mail />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Email address</ItemTitle>
              <ItemDescription>dollarwolv@gmail.com</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button size={"sm"} variant={"secondary"}>
                Change
              </Button>
            </ItemActions>
          </Item>
          <Item className="w-full">
            <ItemMedia variant={"icon"}>
              <KeyRound />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Password</ItemTitle>
              <ItemDescription>*********</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button size={"sm"} variant={"secondary"}>
                Change
              </Button>
            </ItemActions>
          </Item>
          <Button variant={"secondary"}>
            <LogOut />
            Sign out
          </Button>
        </ItemGroup>
      </div>
      <div className="flex w-full flex-col items-center gap-1">
        <h1 className="text-3xl font-semibold">Plan</h1>
        <ItemGroup className="w-full">
          <Item className="w-full">
            <ItemMedia variant={"icon"}>
              <Crown />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Membership status</ItemTitle>
              <ItemDescription>
                <ul className="list-disc space-y-1 overflow-hidden pl-5">
                  <li className="list-item">Plan: Free</li>
                  <li className="list-item">Unlimited Local Scans</li>
                  <li className="list-item">50 Monthly Cloud Scans</li>
                </ul>
              </ItemDescription>
            </ItemContent>
          </Item>
          <Item>
            <ItemMedia variant={"icon"}>
              <ScanEye />
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="w-full">
                <span>Free Cloud Scans Left:</span>
                <span className="ml-auto font-light">{scansUsed}</span>
              </ItemTitle>
              <ItemDescription>
                <Progress value={scansUsed} />
                <span className="text-[12px]">Resets on June 1st</span>
              </ItemDescription>
            </ItemContent>
          </Item>
          <Button>
            <CircleArrowUp color="white" />
            Upgrade to Pro
          </Button>
        </ItemGroup>
      </div>
    </div>
  );
}

export default Profile;
