import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldGroup,
  FieldTitle,
  FieldDescription,
  FieldSeparator,
  FieldLabel,
} from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import Colorful from "@uiw/react-color-colorful";

import { useEffect, useState, useMemo } from "react";

import { useRecordHotkeys } from "react-hotkeys-hook";

function App() {
  const [hydrated, setHydrated] = useState(false);
  const [settings, setSettings] = useState({});

  const [keys, { start, stop, isRecording }] = useRecordHotkeys();

  async function loadSettings() {
    const settingsFromStorage = await chrome.storage.sync.get(null);
    setSettings(settingsFromStorage);
    setHydrated(true);
    console.log("first settings:");
    console.log(settings);
  }

  useEffect(() => {
    loadSettings();
  }, []);

  // remove again later:
  useEffect(() => {
    console.log(keys);
  }, [keys]);

  useEffect(() => {
    if (!hydrated) return;
    const timeout = setTimeout(() => {
      chrome.storage.sync.set(settings);
    }, 500);
    console.log("saveed settings: ");
    console.log(settings);

    return () => clearTimeout(timeout);
  }, [hydrated, settings]);

  return (
    <div className="w-100 p-4">
      <h1 className="mt-4 w-full text-center text-3xl font-bold">Settings</h1>
      <FieldGroup className="mt-8">
        {/* server processing */}
        <Field orientation="vertical" className="">
          <div className="flex gap-3">
            <Switch
              id="enable-server-processing"
              checked={settings.serverProcessingEnabled}
              onCheckedChange={() =>
                setSettings({
                  ...settings,
                  serverProcessingEnabled: !settings.serverProcessingEnabled,
                })
              }
              name="enable-server-processing"
            />
            <FieldLabel htmlFor="enable-server-processing">
              Enable server processing
            </FieldLabel>
          </div>
          <FieldDescription>
            By default, OCR is performed locally in your browser. However,
            server processing is both quicker and more accurate. We don't store
            your screenshot data.
          </FieldDescription>
        </Field>
        <FieldSeparator />
        {/* dev settings enabled */}
        <Field orientation="horizontal" className="">
          <Checkbox
            id="enable-dev-settings"
            checked={settings.devSettingsEnabled}
            onCheckedChange={() =>
              setSettings({
                ...settings,
                devSettingsEnabled: !settings.devSettingsEnabled,
              })
            }
            name="enable-dev-settings"
          />
          <FieldLabel htmlFor="enable-dev-settings">
            Enable dev settings
          </FieldLabel>
        </Field>
        <FieldSeparator />
        {/* OCR speed/accuracy tradeoff */}
        <Field>
          <FieldTitle>OCR Speed/Accuracy</FieldTitle>
          <FieldDescription>
            Change this setting to make the OCR more accurate. However, this
            also sacrifices speed.
          </FieldDescription>
          <div className="flex w-full items-center justify-between">
            <span className="text-muted-foreground">Faster</span>
            <span className="text-muted-foreground">More accurate</span>
          </div>
          <Slider
            // needs to be an array otherwise will crash
            value={[settings.ocrSpeed]}
            onValueChange={(value) => {
              setSettings({
                ...settings,
                ocrSpeed: value[0],
              });
            }}
            min={1}
            max={5}
            step={1}
          />
        </Field>
        <FieldSeparator />
      </FieldGroup>
      <div>
        <h1 className="mt-8 text-3xl">Appearance</h1>
        <FieldGroup className="mt-2">
          <Field>
            <FieldTitle>Overlay Text Color</FieldTitle>
            <Colorful
              color={settings.captionTextColor}
              onChange={(color) =>
                setSettings({ ...settings, captionTextColor: color.hex })
              }
            />
          </Field>
          <FieldSeparator />
          <Field orientation="vertical" className="">
            <div className="flex gap-3">
              <Switch
                id="enable-caption-background"
                checked={settings.captionBgEnabled}
                onCheckedChange={() =>
                  setSettings({
                    ...settings,
                    captionBgEnabled: !settings.captionBgEnabled,
                  })
                }
                name="enable-caption-background"
              />
              <FieldLabel htmlFor="enable-server-processing">
                Enable Caption Background
              </FieldLabel>
            </div>
          </Field>
        </FieldGroup>
      </div>
      <div>
        <h1 className="mt-8 text-3xl">Keyboard Shortcuts</h1>
        <FieldGroup className="mt-2">
          <Field>
            <FieldTitle>Trigger OCR</FieldTitle>
            <FieldDescription>
              The shortcut that opens the image recognition overlay and starts
              recognizing Chinese Characters on the screen.
            </FieldDescription>
            <div className="flex flex-col gap-2">
              <div className="flex flex-row items-center gap-1">
                {isRecording ? (
                  <>
                    <span className="text-base">Recorded keys: </span>
                    {Array.from(keys).map((item, index) => (
                      <>
                        <span className="bg-accent rounded px-1.5 py-0.75 text-sm">
                          {item}
                        </span>
                        <span>
                          {index == Array.from(keys).length - 1 ? "" : " + "}
                        </span>
                      </>
                    ))}
                  </>
                ) : (
                  <>
                    <span className="text-base">Currently: </span>
                    {settings.openOCRShortcut?.map((item, index) => (
                      <>
                        <span className="bg-accent rounded px-1.5 py-0.75 text-sm">
                          {item}
                        </span>
                        <span>
                          {index == settings.openOCRShortcut.length - 1
                            ? ""
                            : " + "}
                        </span>
                      </>
                    ))}
                  </>
                )}
              </div>
              {isRecording ? (
                <Button
                  size={"sm"}
                  onClick={() => {
                    stop();
                    setSettings({
                      ...settings,
                      openOCRShortcut:
                        Array.from(keys).length > 1
                          ? Array.from(keys)
                          : ["ctrl", "o"],
                    });
                  }}
                >
                  Save
                </Button>
              ) : (
                <Button size={"sm"} onClick={start}>
                  Edit shortcut
                </Button>
              )}
            </div>
          </Field>
          <FieldSeparator />
        </FieldGroup>
      </div>
      {settings.devSettingsEnabled && (
        <div>
          <h1 className="mt-8 text-3xl">Developer settings</h1>
          <FieldGroup className="mt-2">
            {/* max image dims */}
            <Field>
              <FieldLabel htmlFor="max-dimension">
                Maximum image dimension
              </FieldLabel>
              <FieldDescription>
                Maximum dimension that screenshot gets scaled down to before
                being analyzed. Higher resolution = more accurate. Lower
                resolution = faster processing. Recommended to keep between 640
                (very low) and 1200 (probably good enough).
              </FieldDescription>
              <Input
                type="number"
                id="max-dimension"
                value={settings.maxDim}
                onChange={(e) => {
                  setSettings({ ...settings, maxDim: e.target.value });
                }}
              />
              <span className="text-muted-foreground">
                Example: a screenshot is originally 1920x1080px. If the max
                resolution is set to 800, it gets downscaled to 800x450px.
              </span>
            </Field>
          </FieldGroup>
        </div>
      )}
    </div>
  );
}

export default App;
