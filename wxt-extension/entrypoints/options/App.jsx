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

import { useEffect, useState } from "react";

function App() {
  const [hydrated, setHydrated] = useState(false);
  const [settings, setSettings] = useState({});

  async function loadSettings() {
    const settingsFromStorage = await chrome.storage.sync.get(null);
    setSettings(settingsFromStorage);
    setHydrated(true);
  }

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    chrome.storage.sync.set(settings);
  }, [hydrated, settings]);

  return (
    <div className="w-100 p-4">
      <h1 className="mt-4 w-full text-center text-3xl font-bold">Settings</h1>
      <FieldGroup className="mt-8">
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
            value={settings.ocrSpeed}
            onValueChange={(value) =>
              setSettings({
                ...settings,
                ocrSpeed: value,
              })
            }
            min={1}
            max={5}
            step={1}
          />
        </Field>
      </FieldGroup>
      {settings.devSettingsEnabled && (
        <div>
          <h1 className="mt-8 text-3xl">Developer settings</h1>
          <FieldGroup className="mt-2">
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
