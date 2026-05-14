import {
  Crop,
  Cloud,
  Settings,
  CircleUser,
  CloudOff,
  CircleArrowUp,
  Fullscreen,
  LogIn,
  CircleHelp,
  X,
} from "lucide-react";
import zhongLensIcon from "@/assets/icon_zi_full.png";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CLOUD_OCR_FREE_LIMIT, getRemainingCloudOcrUses } from "@/lib/cloudOcr";
import { sendMessage } from "webext-bridge/popup";

import { Link } from "react-router";
import { useEffect, useState } from "react";
import { captureEvent } from "@/lib/posthog";
import { getOcrAnalyticsProperties } from "@/lib/ocrAnalytics";

function App() {
  const [settings, setSettings] = useState({});
  const [error, setError] = useState("");
  const [cropOverlayOpen, setCropOverlayOpen] = useState(false);
  const [OCROverlayOpen, setOCROverlayOpen] = useState(false);
  const [cropDims, setCropDims] = useState({});
  const [cloudOcrFreeUseCount, setCloudOcrFreeUseCount] = useState(0);

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

      if (overlayType === "CROP") {
        setCropOverlayOpen(res.mounted);
        void captureEvent("crop_region_selection_opened", {
          mounted: res.mounted,
        });
      }
      if (overlayType === "OCR") {
        setOCROverlayOpen(res.mounted);
        if (res.mounted) {
          // Track the user's intent before the OCR overlay starts processing.
          const properties = await getOcrAnalyticsProperties({
            trigger: "popup",
            isLoggedIn,
            isSubscribed,
          });
          void captureEvent("ocr_requested", properties);
        }
      }
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

  async function capturePopupOpened(settingsFromStorage) {
    // This is a simple page-view style event for the popup, with enough context
    // to understand what state the user was in when they opened it.
    let popupIsLoggedIn = false;
    let popupIsSubscribed = false;

    try {
      const sessionRes = await sendMessage(
        "AUTH_GET_SESSION",
        {},
        "background",
      );
      popupIsLoggedIn = Boolean(sessionRes?.session);

      if (popupIsLoggedIn) {
        const subscriptionRes = await sendMessage(
          "GET_SUBSCRIPTION_STATUS",
          { useCached: true },
          "background",
        );
        popupIsSubscribed = Boolean(subscriptionRes?.userSubscribed);
      }
    } catch {
      // Analytics should never block the popup from opening.
    }

    void captureEvent("popup_opened", {
      is_logged_in: popupIsLoggedIn,
      is_subscribed: popupIsSubscribed,
      crop_enabled: Boolean(settingsFromStorage.crop),
      cloud_enabled: Boolean(settingsFromStorage.serverProcessingEnabled),
      cloud_ocr_remaining: getRemainingCloudOcrUses(
        settingsFromStorage.cloudOcrFreeUseCount,
      ),
      has_completed_onboarding: Boolean(
        settingsFromStorage.hasCompletedOnboarding,
      ),
    });
  }

  useEffect(() => {
    (async () => {
      const settingsFromStorage = await chrome.storage.sync.get(null);
      setSettings(settingsFromStorage);
      setCloudOcrFreeUseCount(
        Number(settingsFromStorage.cloudOcrFreeUseCount) || 0,
      );
      void capturePopupOpened(settingsFromStorage);
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
    const handleStorageChange = (changes, areaName) => {
      if (areaName !== "sync" || !changes.cloudOcrFreeUseCount) return;

      setCloudOcrFreeUseCount(
        Number(changes.cloudOcrFreeUseCount.newValue) || 0,
      );
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
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

  const cloudOcrRemainingCount = getRemainingCloudOcrUses(cloudOcrFreeUseCount);
  const cropModeEnabled = Boolean(settings.crop);
  const cloudOcrEnabled = Boolean(settings.serverProcessingEnabled);

  function toggleCropMode() {
    const newCrop = !cropModeEnabled;
    setSettings({ ...settings, crop: newCrop });
    void captureEvent("crop_mode_toggled", { enabled: newCrop });
    toast.success(
      `${cropModeEnabled ? "Now using fullscreen mode." : "Now using crop mode."}`,
      {
        position: "top-center",
        duration: 1500,
      },
    );
  }

  function toggleCloudOcrMode() {
    const newEnabled = !cloudOcrEnabled;
    setSettings({
      ...settings,
      serverProcessingEnabled: newEnabled,
    });
    void captureEvent("cloud_ocr_toggled", {
      enabled: newEnabled,
    });
    newEnabled
      ? toast.success("Cloud OCR on.", {
          position: "top-center",
          duration: 1500,
        })
      : toast.error("Cloud OCR off - using Local OCR.", {
          position: "top-center",
          duration: 1500,
        });
  }

  return (
    <div className="relative flex w-86 flex-col items-center gap-3 p-4">
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
            onClick={() => {
              void captureEvent("onboarding_opened");
              chrome.tabs.create({
                url: chrome.runtime.getURL("/onboarding.html"),
              });
            }}
          >
            New here? Learn how to use ZhongLens
          </button>
        )}
        <div className="flex flex-row items-center justify-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                role="switch"
                aria-checked={cropModeEnabled}
                aria-label={
                  cropModeEnabled
                    ? "Crop mode is enabled"
                    : "Fullscreen mode is enabled"
                }
                className="relative flex cursor-pointer flex-col items-center justify-center rounded p-1.5 transition-shadow hover:shadow"
                onClick={toggleCropMode}
              >
                <span
                  className={`relative flex h-6 w-12 items-center rounded-full border px-1 text-[10px] font-medium transition-colors ${
                    cropModeEnabled
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-muted text-muted-foreground"
                  }`}
                >
                  <span
                    className={`bg-background text-foreground absolute top-0 flex size-5.5 items-center justify-center rounded-full shadow transition-[left] ${
                      cropModeEnabled ? "left-[calc(100%-1.375rem)]" : "left-0"
                    }`}
                  >
                    {cropModeEnabled ? (
                      <Crop className="size-4" />
                    ) : (
                      <X className="size-4" />
                    )}
                  </span>
                </span>
                <span className="text-sm">Crop Mode</span>
              </button>
            </TooltipTrigger>
            <TooltipContent className="flex flex-col items-center">
              <p>Crop to text location for</p>
              <p>better speed and accuracy.</p>
              <p>
                {cropModeEnabled
                  ? "Click to switch back to fullscreen mode."
                  : "Currently in fullscreen mode."}
              </p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                role="switch"
                aria-checked={cloudOcrEnabled}
                aria-label={
                  cloudOcrEnabled
                    ? "Cloud OCR is enabled"
                    : "Local OCR is enabled"
                }
                className="relative flex cursor-pointer flex-col items-center justify-center rounded p-1.5 transition-shadow hover:shadow"
                onClick={toggleCloudOcrMode}
              >
                {!isSubscribed && cloudOcrEnabled && (
                  <span className="pointer-events-none absolute -top-1 -right-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white shadow">
                    {cloudOcrRemainingCount}
                  </span>
                )}
                <span
                  className={`relative flex h-6 w-12 items-center rounded-full border px-1 text-[10px] font-medium transition-colors ${
                    cloudOcrEnabled
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-muted text-muted-foreground"
                  }`}
                >
                  <span
                    className={`bg-background text-foreground absolute top-0 flex size-5.5 items-center justify-center rounded-full shadow transition-[left] ${
                      cloudOcrEnabled ? "left-[calc(100%-1.375rem)]" : "left-0"
                    }`}
                  >
                    {cloudOcrEnabled ? (
                      <Cloud className="size-4" />
                    ) : (
                      <CloudOff className="size-4" />
                    )}
                  </span>
                </span>
                <span className="text-sm">Cloud OCR</span>
              </button>
            </TooltipTrigger>
            <TooltipContent className="flex flex-col items-center">
              <p>Local: fast, less accurate</p>
              <p>Cloud: slower, more accurate</p>
              {isSubscribed ? (
                <p>Supporter: unlimited cloud OCR scans</p>
              ) : (
                <>
                  <p>{cloudOcrRemainingCount} free cloud scans remaining</p>
                </>
              )}
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
        {cropModeEnabled && (
          <div className="flex flex-col justify-center gap-2">
            <span className="text-center text-xs font-extralight">
              {Object.values(cropDims).some((value) => value === undefined)
                ? "You haven't selected a region to crop to yet. Use the button below to select it."
                : "Currently cropping to: " +
                  `(${cropDims.cropXStart} | ${cropDims.cropYStart}), (${cropDims.cropYEnd} | ${cropDims.cropYEnd})`}
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
