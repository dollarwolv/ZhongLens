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
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);

  async function screenshot() {
    setLoading(true);
    const { cssW, cssH } = getViewportCssSize();
    const res = await sendMessage("CAPTURE_TAB", { cssW, cssH }, "background");
    if (!res.ok) {
      setError(res?.error);
      setLoading(false);
    }
    const resultData = res?.result;
    const mode = res?.mode;

    let data = [];

    if (mode === "server_ocr") {
      data = resultData.rec_texts.map((text, index) => {
        return [text, resultData.rec_polys[index]];
      });
    } else if (mode === "local_ocr") {
      console.log(resultData);
      data = resultData
        .filter((item) => item.confidence > 0.9)
        .map((item, index) => {
          const bbox = item.bbox;
          const fullBoundingBox = [
            [bbox.x0, bbox.y0],
            [bbox.x1, bbox.y0],
            [bbox.x1, bbox.y1],
            [bbox.x0, bbox.y1],
          ];
          return [item.text, fullBoundingBox];
        });
    }

    setData(data);
    if (data.length === 0) {
      setError("No text found. Please try again.");
    }
    setStartX(res?.startX);
    setStartY(res?.startY);
    setScalingFactor(res?.scalingFactor);
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
    screenshot();
  }, []);

  useEffect(() => {
    console.log(data);
    console.log("data logged in useeffect");
    console.log("startX: " + startX);
    console.log("startY: " + startY);
  }, [data]);

  return (
    <div className="pointer-events-none fixed top-0 left-0 h-screen w-screen">
      <button
        className="bg-neon-green absolute top-12 right-12 flex h-24 w-24 cursor-pointer items-center justify-center rounded-full"
        onClick={onClose}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M18 6L6 18M6 6l12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {loading && (
        <div className="text-neon-green absolute top-[50%] left-[50%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center">
          <div className="animate-spin">
            <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true">
              <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-dasharray="14 10"
              />
            </svg>
          </div>
          <span>Analyzing...</span>`
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
            startX={startX}
            startY={startY}
          />
        );
      })}
    </div>
  );
};
