import { useState, useEffect } from "react";
import ChildText from "./ChildText";
import "~/assets/tailwind.content.css";
import { Checkbox } from "@/components/ui/checkbox";
import { sendMessage } from "webext-bridge/content-script";

export default ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState([]);
  const [scalingFactor, setScalingFactor] = useState(1);
  const [crop, setCrop] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [status, setStatus] = useState("Analyzing...");
  const [mode, setMode] = useState();

  async function getMode() {
    const response = await chrome.storage.sync.get("serverProcessingEnabled");
    const serverProcessingEnabled = response.serverProcessingEnabled;
    if (serverProcessingEnabled) setMode("Cloud OCR");
    else setMode("Local OCR");
  }

  async function screenshot() {
    setLoading(true);
    const { cssW, cssH } = getViewportCssSize();
    setStatus("Processing image...");
    const res = await sendMessage("CAPTURE_TAB", { cssW, cssH }, "background");
    if (!res.ok) {
      setError(res?.error);
      setLoading(false);
      return;
    }
    setStatus("Untangling response...");
    const resultData = res?.result;
    const mode = res?.mode;

    let data = [];

    if (mode === "server_ocr") {
      data = resultData.rec_texts.map((text, index) => {
        return [text, resultData.rec_polys[index]];
      });
    } else if (mode === "local_ocr") {
      data = resultData
        .filter((item) => item.confidence > 50)
        .map((item, index) => {
          const bbox = item.bbox;
          const fullBoundingBox = [
            [bbox.x0, bbox.y0],
            [bbox.x1, bbox.y0],
            [bbox.x1, bbox.y1],
            [bbox.x0, bbox.y1],
          ];
          let filteredText = "";
          for (const word of item.words) {
            if (word.confidence > 60) {
              filteredText += word.text;
            } else {
              filteredText += " ";
            }
          }
          return [filteredText, fullBoundingBox];
        });
    }

    setData(data);
    if (data.length === 0) {
      setError("No text found. Please try again.");
    }
    setStartX(res?.startX);
    setStartY(res?.startY);
    setScalingFactor(res?.scalingFactor);
    setCrop(res?.crop);
    setLoading(false);
  }

  function getViewportCssSize() {
    const vv = window.visualViewport;
    return {
      cssW: Math.round(vv?.width ?? window.innerWidth),
      cssH: Math.round(vv?.height ?? window.innerHeight),
    };
  }

  useEffect(() => {
    getMode();
    screenshot();
  }, []);

  useEffect(() => {
    console.log(data);
    console.log("data logged in useeffect");
    console.log("startX: " + startX);
    console.log("startY: " + startY);
  }, [data]);

  return (
    <div className="font-noto pointer-events-none fixed top-0 left-0 z-9999 h-screen w-screen">
      <button
        type="button"
        aria-label="Close overlay"
        className="hover:border-neon-green/70 hover:text-neon-green focus-visible:ring-neon-green/70 pointer-events-auto absolute top-6 right-6 flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/70 text-white shadow-lg shadow-black/30 backdrop-blur-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 focus-visible:outline-none"
        onClick={onClose}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M18 6L6 18M6 6l12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {loading && (
        <div className="text-neon-green absolute top-[50%] left-[50%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="block animate-spin"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="14 10"
            />
          </svg>
          <span className="mt-2">Using {mode}</span>
          <span className="mt-2">{status}</span>
        </div>
      )}
      {error && (
        <div className="absolute top-[50%] left-[50%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-green-400">
          <span>{error}</span>
        </div>
      )}
      {data.map((entry, index) => {
        return (
          <ChildText
            entry={entry}
            key={index}
            scalingFactor={scalingFactor}
            crop={crop}
            startX={startX}
            startY={startY}
          />
        );
      })}
    </div>
  );
};
