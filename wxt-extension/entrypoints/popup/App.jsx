import {
  Crop,
  Camera,
  Cloud,
  Settings,
  CircleUser,
  CloudOff,
  CircleArrowUp,
  Fullscreen,
} from "lucide-react";
import zhongLensIcon from "@/assets/icon_zi_full.png";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Field, FieldLabel } from "@/components/ui/field";
import { sendMessage, onMessage } from "webext-bridge/popup";

import { Link } from "react-router";

function App() {
  const [settings, setSettings] = useState({});
  const [error, setError] = useState("");
  const [cropOverlayOpen, setCropOverlayOpen] = useState(false);
  const [OCROverlayOpen, setOCROverlayOpen] = useState(false);
  const [cropDims, setCropDims] = useState({});

  async function controlCropOverlay() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) {
        throw new Error("No active tab found.");
      }

      const res = await chrome.tabs.sendMessage(tab.id, {
        type: "TOGGLE_CROP_OVERLAY",
      });

      if (!res?.ok) {
        throw new Error(
          res?.error ||
            "Something went wrong opening crop overlay. Please try again.",
        );
      }

      setCropOverlayOpen(res.mounted);
    } catch (err) {
      setError(err.message);
    }
  }

  async function controlOCROverlay() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) {
        throw new Error("No active tab found.");
      }

      const res = await chrome.tabs.sendMessage(tab.id, {
        type: "TOGGLE_OCR_OVERLAY",
      });

      if (!res?.ok) {
        throw new Error(
          res?.error ||
            "Something went wrong opening OCR overlay. Please try again.",
        );
      }

      setOCROverlayOpen(res.mounted);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    (async () => {
      const settingsFromStorage = await chrome.storage.sync.get(null);
      setSettings(settingsFromStorage);

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
          type: "GET_CROP_OVERLAY_STATE",
        });

        if (!res?.ok) {
          throw new Error(
            res?.error || "Something went wrong getting crop overlay state.",
          );
        }

        setCropOverlayOpen(res.mounted);
      } catch (err) {
        setError(err.message);
      }

      // ocr overlay
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (!tab?.id) {
          throw new Error("No active tab found.");
        }

        const res = await chrome.tabs.sendMessage(tab.id, {
          type: "GET_OCR_OVERLAY_STATE",
        });

        if (!res?.ok) {
          throw new Error(
            res?.error || "Something went wrong getting OCR overlay state.",
          );
        }

        setOCROverlayOpen(res.mounted);
      } catch (err) {
        setError(err.message);
      }
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

  return (
    <div className="flex w-80 flex-col items-center gap-3 p-4">
      <div className="flex w-full flex-row items-center justify-center gap-5">
        <img src="/icon/128.png" alt="ZhongLens logo" className="w-10" />
        <h1 className="text-2xl">ZhongLens v0</h1>
      </div>
      <button
        className="bg-beige mx-auto flex h-50 cursor-pointer flex-col items-center justify-center rounded-lg px-3.5 py-2 shadow-lg"
        onClick={controlOCROverlay}
      >
        <img src={zhongLensIcon} className="w-35" alt="" />
        <span className="text-2xl font-semibold whitespace-nowrap">
          {OCROverlayOpen ? "Close overlay" : "Capture Tab"}
        </span>
      </button>
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2.5">
          <button
            className="flex cursor-pointer flex-col items-center justify-center rounded p-2 transition-shadow hover:shadow"
            onClick={() => {
              setSettings({ ...settings, crop: !settings.crop });
            }}
          >
            {settings.crop ? <Crop /> : <Fullscreen />}
            <span className="text-sm">
              {settings.crop ? "Crop" : "Fullscreen"}
            </span>
          </button>
          <button
            className="flex cursor-pointer flex-col items-center justify-center rounded p-2 transition-shadow hover:shadow"
            onClick={() => {
              setSettings({
                ...settings,
                serverProcessingEnabled: !settings.serverProcessingEnabled,
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
          <button className="flex cursor-pointer flex-col items-center justify-center rounded p-2 transition-shadow hover:shadow">
            <Settings />
            <span className="text-sm">Settings</span>
          </button>
          <Link
            className="flex cursor-pointer flex-col items-center justify-center rounded p-2 transition-shadow hover:shadow"
            to={"/login"}
          >
            <CircleUser />
            <span className="text-sm">Profile</span>
          </Link>
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
              onClick={controlCropOverlay}
            >
              {cropOverlayOpen ? "Close crop overlay" : "Select region to crop"}
            </Button>
          </div>
        )}
        <Button>
          <CircleArrowUp color="white" />
          Upgrade to Pro
        </Button>
      </div>
      <div className="flex flex-col items-center justify-center gap-0.5">
        <span className="text-center text-xs font-light">
          Found a bug? Thought of a feature? Contact me at dev@zhonglens.dev.
        </span>
      </div>
    </div>
  );
}

export default App;
