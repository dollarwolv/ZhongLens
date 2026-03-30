import {
  Crop,
  Camera,
  Cloud,
  Settings,
  CircleUser,
  CloudOff,
  CircleArrowUp,
  Fullscreen,
  LogIn,
  HandFist,
  CircleHelp,
} from "lucide-react";
import zhongLensIcon from "@/assets/icon_zi_full.png";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { sendMessage } from "webext-bridge/popup";

import { Link } from "react-router";
import { useEffect, useState } from "react";

function App() {
  const [settings, setSettings] = useState({});
  const [error, setError] = useState("");
  const [cropOverlayOpen, setCropOverlayOpen] = useState(false);
  const [OCROverlayOpen, setOCROverlayOpen] = useState(false);
  const [cropDims, setCropDims] = useState({});

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  async function getOverlayState(overlayType) {
    // crop overlay
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) {
        throw new Error("No active tab found.");
      }

      const res = await chrome.tabs.sendMessage(tab.id, {
        type: `GET_${overlayType}_OVERLAY_STATE`,
      });

      if (!res?.ok) {
        throw new Error(
          res?.error ||
            `Something went wrong getting ${overlayType} overlay state.`,
        );
      }

      if (overlayType === "CROP") setCropOverlayOpen(res.mounted);
      else if (overlayType === "OCR") setOCROverlayOpen(res.mounted);
    } catch (err) {
      console.error(err.message);
    }
  }

  async function controlOverlay(overlayType) {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) {
        throw new Error("No active tab found.");
      }

      const res = await chrome.tabs.sendMessage(tab.id, {
        type: `TOGGLE_${overlayType}_OVERLAY`,
      });

      if (!res?.ok) {
        throw new Error(
          res?.error ||
            `Something went wrong opening ${overlayType} overlay. Please try again.`,
        );
      }

      if (overlayType === "CROP") setCropOverlayOpen(res.mounted);
      if (overlayType === "OCR") setOCROverlayOpen(res.mounted);
    } catch (err) {
      console.error(err.message);
    }
  }

  async function getLoginStatus() {
    try {
      const res = await sendMessage("AUTH_GET_SESSION", {}, "background");
      if (!res?.ok) {
        throw new Error(res?.error);
      }

      if (res?.session) {
        setIsLoggedIn(true);
      }
    } catch (error) {
      setError(error.message);
    }
  }

  async function getSubscriptionStatus(useCached = true) {
    try {
      const res = await sendMessage(
        "GET_SUBSCRIPTION_STATUS",
        { useCached },
        "background",
      );

      if (!res?.ok) {
        throw new Error(res?.error);
      }

      if (res.userSubscribed) {
        setIsSubscribed(true);
      }
    } catch (error) {
      setError(error.message);
    }
  }

  useEffect(() => {
    (async () => {
      const settingsFromStorage = await chrome.storage.sync.get(null);
      setSettings(settingsFromStorage);
      getOverlayState("CROP");
      getOverlayState("OCR");
      getLoginStatus();
    })();

    // get crop settings to display
    chrome.storage.sync.get(
      ["cropXStart", "cropYStart", "cropXEnd", "cropYEnd"],
      (items) => {
        setCropDims({
          cropXStart: items.cropXStart,
          cropYStart: items.cropYStart,
          cropXEnd: items.cropXEnd,
          cropYEnd: items.cropYEnd,
        });
      },
    );
  }, []);

  useEffect(() => {
    console.log(settings);
    chrome.storage.sync.set(settings);
    console.log("settings saved");
  }, [settings]);

  useEffect(() => {
    if (isLoggedIn) {
      getSubscriptionStatus();
    } else {
      setIsSubscribed(false);
    }
  }, [isLoggedIn]);

  return (
    <div className="relative flex w-80 flex-col items-center gap-3 p-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            variant="outline"
            size="icon-sm"
            className="absolute top-4 right-4 rounded-full"
          >
            <Link to="/faq" aria-label="Open FAQ">
              <CircleHelp />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>How to use ZhongLens</p>
        </TooltipContent>
      </Tooltip>
      <div className="flex w-full flex-row items-center justify-center gap-5">
        <img src="/icon/128.png" alt="ZhongLens logo" className="w-10" />
        <h1 className="text-2xl">ZhongLens v0</h1>
      </div>
      <button
        className="bg-beige mx-auto flex h-50 cursor-pointer flex-col items-center justify-center rounded-lg px-3.5 py-2 shadow-lg"
        onClick={() => controlOverlay("OCR")}
      >
        <img src={zhongLensIcon} className="w-35" alt="" />
        <span className="text-2xl font-semibold whitespace-nowrap">
          {OCROverlayOpen ? "Close overlay" : "Capture Tab"}
        </span>
      </button>
      <div className="flex flex-col gap-2">
        {!settings?.hasCompletedOnboarding && (
          <button
            className="text-muted-foreground hover:text-foreground text-xs underline transition-colors"
            onClick={() =>
              chrome.tabs.create({
                url: chrome.runtime.getURL("/onboarding.html"),
              })
            }
          >
            New here? Learn how to use ZhongLens
          </button>
        )}
        <div className="flex flex-row gap-2.5">
          <Tooltip>
            <TooltipTrigger>
              <button
                className="flex cursor-pointer flex-col items-center justify-center rounded p-2 transition-shadow hover:shadow"
                onClick={() => {
                  setSettings({ ...settings, crop: !settings.crop });
                  toast.success(
                    `${settings.crop ? "Now using fullscreen mode." : "Now using crop mode."}`,
                    {
                      position: "top-center",
                      duration: 1500,
                    },
                  );
                }}
              >
                {settings.crop ? <Crop /> : <Fullscreen />}
                <span className="text-sm">
                  {settings.crop ? "Crop" : "Fullscreen"}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent className="flex flex-col items-center">
              <p>Crop to text location for</p>
              <p>better speed and accuracy.</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <button
                className="flex cursor-pointer flex-col items-center justify-center rounded p-2 transition-shadow hover:shadow"
                onClick={() => {
                  setSettings({
                    ...settings,
                    serverProcessingEnabled: !settings.serverProcessingEnabled,
                  });
                  settings.serverProcessingEnabled
                    ? toast.error("Cloud OCR is now off.", {
                        position: "top-center",
                        duration: 1500,
                      })
                    : toast.success("Cloud OCR is now active.", {
                        position: "top-center",
                        duration: 1500,
                      });
                }}
              >
                {settings.serverProcessingEnabled ? (
                  <>
                    <Cloud />
                    <span className="text-sm">Cloud</span>
                  </>
                ) : (
                  <>
                    <CloudOff />
                    <span className="text-sm">Local</span>
                  </>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent className="flex flex-col items-center">
              <p>Local: fast, less accurate</p>
              <p>Cloud: slower, more accurate</p>
              <p>21 free cloud scans remaining</p>
            </TooltipContent>
          </Tooltip>
          <Link
            to={"/settings"}
            className="flex cursor-pointer flex-col items-center justify-center rounded p-2 transition-shadow hover:shadow"
          >
            <Settings />
            <span className="text-sm">Settings</span>
          </Link>

          {isLoggedIn ? (
            <Link
              className="flex cursor-pointer flex-col items-center justify-center rounded p-2 transition-shadow hover:shadow"
              to={"/profile"}
            >
              <CircleUser />
              <span className="text-sm">Profile</span>
            </Link>
          ) : (
            <Link
              className="flex cursor-pointer flex-col items-center justify-center rounded p-2 transition-shadow hover:shadow"
              to={"/login"}
            >
              <LogIn />
              <span className="text-sm">Login</span>
            </Link>
          )}
        </div>
        {settings.crop && (
          <div className="flex flex-col justify-center gap-2">
            <span className="text-xs font-extralight">
              Currently cropping to:{" "}
              {`(${cropDims.cropXStart} | ${cropDims.cropYStart}), (${cropDims.cropYEnd} | ${cropDims.cropYEnd})`}
            </span>
            <Button
              size={"xs"}
              variant={"secondary"}
              onClick={() => controlOverlay("CROP")}
            >
              {cropOverlayOpen ? "Close crop overlay" : "Select region to crop"}
            </Button>
          </div>
        )}

        {!isSubscribed && (
          <Button>
            <Link
              to={"/upgrade"}
              className="flex flex-row items-center justify-center gap-2"
            >
              <CircleArrowUp color="white" />
              Upgrade to Supporter
            </Link>
          </Button>
        )}
      </div>
      <div className="flex flex-col items-center justify-center gap-0.5">
        <span className="text-center text-xs font-light">
          Found a bug? Thought of a feature? Contact me at dev@zhonglens.dev.
        </span>
        {error && (
          <span className="text-center text-xs font-light text-red-500">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}

export default App;
