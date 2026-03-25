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
import { Input } from "@/components/ui/input";
import {
  Mail,
  Crown,
  KeyRound,
  ScanEye,
  CircleArrowUp,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { sendMessage } from "webext-bridge/popup";

function Profile() {
  const navigate = useNavigate();

  const [scansUsed, setScansUsed] = useState(25);

  const [email, setEmail] = useState("");
  const [updateEmail, setUpdateEmail] = useState(false);
  const [updatedEmail, setUpdatedEmail] = useState("");

  const [updatePassword, setUpdatePassword] = useState(false);
  const [updatedPassword, setUpdatedPassword] = useState("");

  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  const [error, setError] = useState("");

  const handleEmailSave = async () => {
    if (updatedEmail.trim() !== "") {
      const res = await sendMessage(
        "AUTH_UPDATE_USER",
        { email: updatedEmail },
        "background",
      );
      if (!res.ok) {
        setError(
          res.error || "There has been an error changing your password.",
        );
      } else {
        setEmail(updatedEmail);
        setUpdateEmail(false);
        setEmailConfirmationSent(true);
      }
    }
    setUpdatedEmail("");
  };

  const handleEmailCancel = () => {
    setUpdatedEmail("");
    setUpdateEmail(false);
  };

  const handlePasswordSave = async () => {
    if (updatedPassword.trim() !== "") {
      const res = await sendMessage(
        "AUTH_UPDATE_USER",
        { password: updatedPassword },
        "background",
      );
      if (!res.ok) {
        setError(
          res.error || "There has been an error changing your password.",
        );
      } else {
        setUpdatePassword(false);
        setPasswordUpdated(true);
      }
    }
    setUpdatedPassword("");
  };

  const handlePasswordCancel = () => {
    setUpdatedPassword("");
    setUpdatePassword(false);
  };

  const handleOpenPortal = async () => {
    const sessionRes = await sendMessage("AUTH_GET_SESSION", {}, "background");
    const accessToken = sessionRes?.session?.access_token;

    const res = await sendMessage(
      "OPEN_CUSTOMER_PORTAL",
      { accessToken: accessToken },
      "background",
    );

    if (!res.ok) {
      setError(res.error);
    } else {
      chrome.tabs.create({ url: res.stripeUrl });
    }
  };

  useEffect(() => {
    (async () => {
      const res = await sendMessage("AUTH_GET_SESSION", {}, "background");
      if (!res?.ok) {
        setError(res.error || "There has been an error fetching your session.");
      } else {
        setEmail(res.session.user.email);
      }
    })();
  }, []);

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
              {updateEmail ? (
                <Input
                  id="updated-email"
                  type="text"
                  placeholder="New Email"
                  value={updatedEmail}
                  onChange={(e) => setUpdatedEmail(e.target.value)}
                />
              ) : emailConfirmationSent ? (
                <ItemDescription>
                  Confirmation email sent. Changes will take effect after
                  confirmation.
                </ItemDescription>
              ) : (
                <ItemDescription>{email}</ItemDescription>
              )}
            </ItemContent>
            <ItemActions>
              {!emailConfirmationSent &&
                (!updateEmail ? (
                  <Button
                    size={"sm"}
                    variant={"secondary"}
                    onClick={() => setUpdateEmail(true)}
                  >
                    Change
                  </Button>
                ) : (
                  <div className="flex flex-col gap-1">
                    <Button size={"sm"} onClick={handleEmailSave}>
                      Save
                    </Button>
                    <Button
                      variant={"secondary"}
                      size={"sm"}
                      onClick={handleEmailCancel}
                    >
                      Cancel
                    </Button>
                  </div>
                ))}
            </ItemActions>
          </Item>

          <Item className="w-full">
            <ItemMedia variant={"icon"}>
              <KeyRound />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Password</ItemTitle>
              {updatePassword ? (
                <Input
                  id="updated-password"
                  type="password"
                  placeholder="New Password"
                  value={updatedPassword}
                  onChange={(e) => setUpdatedPassword(e.target.value)}
                />
              ) : passwordUpdated ? (
                <ItemDescription>
                  Password updated successfully.
                </ItemDescription>
              ) : (
                <ItemDescription>*********</ItemDescription>
              )}
            </ItemContent>
            <ItemActions>
              {!passwordUpdated &&
                (!updatePassword ? (
                  <Button
                    size={"sm"}
                    variant={"secondary"}
                    onClick={() => setUpdatePassword(true)}
                  >
                    Change
                  </Button>
                ) : (
                  <div className="flex flex-col gap-1">
                    <Button size={"sm"} onClick={handlePasswordSave}>
                      Save
                    </Button>
                    <Button
                      variant={"secondary"}
                      size={"sm"}
                      onClick={handlePasswordCancel}
                    >
                      Cancel
                    </Button>
                  </div>
                ))}
            </ItemActions>
          </Item>

          <Button
            variant={"secondary"}
            onClick={async (e) => {
              e.preventDefault();
              const res = await sendMessage("AUTH_SIGN_OUT", {}, "background");
              if (res.error) setError(res.error);
              else navigate("/");
            }}
          >
            <LogOut />
            Sign out
          </Button>
          {error && <span className="text-destructive">{error}</span>}
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
              <div>
                <div className="list-disc space-y-1 overflow-hidden pl-5">
                  <span className="list-item">Plan: Free</span>
                  <span className="list-item">Unlimited Local Scans</span>
                  <span className="list-item">50 Monthly Cloud Scans</span>
                </div>
              </div>
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
          <Button onClick={handleOpenPortal}>
            <CircleArrowUp color="white" />
            Edit/cancel subscription
          </Button>
        </ItemGroup>
      </div>
    </div>
  );
}

export default Profile;
