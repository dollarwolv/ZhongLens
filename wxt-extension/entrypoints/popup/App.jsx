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

function App() {
  const [settings, setSettings] = useState({});
  const [error, setError] = useState("");
  const [cropOverlayOpen, setCropOverlayOpen] = useState(false);

  async function controlCropOverlay() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      setError("No active tab found.");
      return;
    }

    const res = await sendMessage(
      "TOGGLE_CROP_OVERLAY",
      {},
      `content-script@${tab.id}`,
    );

    if (!res || !res?.ok) {
      setError(
        res?.error ||
          "Something went wrong opening crop overlay. Please try again.",
      );
      console.log(res?.error);
      return;
    }

    setCropOverlayOpen(res.mounted);
    console.log("res", res);
  }

  useEffect(() => {
    (async () => {
      const settingsFromStorage = await chrome.storage.sync.get(null);
      setSettings(settingsFromStorage);

      // get crop overlay state to display
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const { ok, error, mounted } = await sendMessage(
        "GET_CROP_OVERLAY_STATE",
        {},
        `content-script@${tab.id}`,
      );
      if (!ok) {
        setError(
          error ||
            "Something went wrong getting crop overlay state. Please try again.",
        );
      } else setCropOverlayOpen(mounted);
    })();
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
      <button className="bg-beige mx-auto flex h-50 cursor-pointer flex-col items-center justify-center rounded-lg px-3.5 py-2 shadow-lg">
        <img src={zhongLensIcon} className="w-35" alt="" />
        <span className="text-2xl font-semibold whitespace-nowrap">
          Capture Tab
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
          <button className="flex cursor-pointer flex-col items-center justify-center rounded p-2 transition-shadow hover:shadow">
            <CircleUser />
            <span className="text-sm">Profile</span>
          </button>
        </div>
        {settings.crop && (
          <Button size={"xs"} variant={"ghost"} onClick={controlCropOverlay}>
            {cropOverlayOpen ? "Close crop overlay" : "Select region to crop"}
          </Button>
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
