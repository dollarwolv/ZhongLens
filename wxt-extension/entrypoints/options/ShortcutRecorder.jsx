import {
  Field,
  FieldGroup,
  FieldTitle,
  FieldDescription,
  FieldSeparator,
  FieldLabel,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";

import { useState } from "react";
import { useRecordHotkeys } from "react-hotkeys-hook";

function ShortcutRecorder({ settings, setSettings, info }) {
  const [keys, { start, stop, isRecording }] = useRecordHotkeys();
  return (
    <>
      <Field>
        <FieldTitle>{info.title}</FieldTitle>
        <FieldDescription>{info.description}</FieldDescription>
        <div className="flex flex-col gap-2.5">
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
                {settings[info.settingsVarName]?.map((item, index) => (
                  <>
                    <span className="bg-accent rounded px-1.5 py-0.75 text-sm">
                      {item}
                    </span>
                    <span>
                      {index == settings[info.settingsVarName].length - 1
                        ? ""
                        : " + "}
                    </span>
                  </>
                ))}
              </>
            )}
          </div>
          {isRecording ? (
            <div className="flex flex-row gap-2">
              <Button
                size={"sm"}
                onClick={() => {
                  stop();
                  setSettings({
                    ...settings,
                    [info.settingsVarName]:
                      Array.from(keys).length > 1
                        ? Array.from(keys)
                        : info.standardKeyCombination,
                  });
                }}
              >
                Save
              </Button>
              <Button size={"sm"} variant={"secondary"} onClick={stop}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size={"sm"} onClick={start} className="w-fit">
              Edit shortcut
            </Button>
          )}
        </div>
      </Field>
    </>
  );
}

export default ShortcutRecorder;
