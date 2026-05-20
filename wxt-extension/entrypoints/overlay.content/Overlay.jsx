import { useState, useEffect, useRef } from "react";
import { sendMessage } from "webext-bridge/content-script";
import { captureEvent } from "@/lib/posthog";
import { getRemainingCloudOcrUses } from "@/lib/cloudOcr";
import {
  getOcrAnalyticsProperties,
  getOcrFailureCode,
  NO_TEXT_FOUND_ERROR,
} from "@/lib/ocrAnalytics";
import {
  removeLightDomTextLayer,
  renderLightDomTextLayer,
} from "./lightDomTextLayer";
import OverlayToolbar from "./OverlayToolbar";

const OVERLAY_CHROME_REVEAL_DELAY_MS = 50;

function waitForNextPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

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
  const [settings, setSettings] = useState({});
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [overlayChromeVisible, setOverlayChromeVisible] = useState(false);
  const overlayChromeTimerRef = useRef(null);

  async function getSettings() {
    const response = await chrome.storage.sync.get(null);
    setSettings(response);
    setMode(response.serverProcessingEnabled ? "Cloud OCR" : "Local OCR");
    return response;
  }

  async function getSubscriptionStatus() {
    try {
      const res = await sendMessage(
        "GET_SUBSCRIPTION_STATUS",
        { useCached: true },
        "background",
      );

      if (res?.ok) {
        setIsSubscribed(Boolean(res.userSubscribed));
      }
    } catch (error) {
      console.error("Failed to get subscription status:", error);
    }
  }

  async function screenshot() {
    // Start timing before the screenshot request so duration_ms covers the
    // whole OCR wait from the user's point of view.
    const startedAt = performance.now();
    setError("");
    setData([]);
    removeLightDomTextLayer();
    setOverlayChromeVisible(false);
    window.clearTimeout(overlayChromeTimerRef.current);
    await waitForNextPaint();
    overlayChromeTimerRef.current = window.setTimeout(() => {
      setOverlayChromeVisible(true);
    }, OVERLAY_CHROME_REVEAL_DELAY_MS);
    setLoading(true);
    const { cssW, cssH } = getViewportCssSize();
    setStatus("Processing image...");
    const res = await sendMessage("CAPTURE_TAB", { cssW, cssH }, "background");
    if (!res.ok) {
      const fullErrorCode = res?.error || "OCR failed.";
      const eventProperties = await getOcrAnalyticsProperties({
        response: res,
      });
      void captureEvent("ocr_failed", {
        ...eventProperties,
        duration_ms: Math.round(performance.now() - startedAt),
        error_code: getOcrFailureCode(
          fullErrorCode,
          eventProperties.processing_mode,
        ),
        full_error_code: fullErrorCode,
      });
      setError(fullErrorCode);
      setData([]);
      removeLightDomTextLayer();
      setLoading(false);
      setOverlayChromeVisible(true);
      window.clearTimeout(overlayChromeTimerRef.current);
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
        .map((item) => {
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

    // This event means OCR work actually started and returned a response.
    // Keep these property names aligned with ocr_requested for easy comparison.
    void captureEvent("ocr_started", {
      processing_mode: mode,
      crop_enabled: Boolean(res?.crop),
    });

    const eventProperties = await getOcrAnalyticsProperties({ response: res });
    if (data.length === 0) {
      void captureEvent("ocr_failed", {
        ...eventProperties,
        duration_ms: Math.round(performance.now() - startedAt),
        error_code: "no_text_found",
        full_error_code: NO_TEXT_FOUND_ERROR,
      });
      setError(NO_TEXT_FOUND_ERROR);
      setData([]);
      removeLightDomTextLayer();
      setLoading(false);
      setOverlayChromeVisible(true);
      window.clearTimeout(overlayChromeTimerRef.current);
      return;
    }

    void captureEvent("ocr_completed", {
      ...eventProperties,
      duration_ms: Math.round(performance.now() - startedAt),
      text_blocks_count: data.length,
    });
    setStartX(res?.startX);
    setStartY(res?.startY);
    setScalingFactor(res?.scalingFactor);
    setCrop(res?.crop);
    setData(data);
    setLoading(false);
    setOverlayChromeVisible(true);
    window.clearTimeout(overlayChromeTimerRef.current);
  }

  async function updateOverlaySetting(updates) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      ...updates,
    }));
    await chrome.storage.sync.set(updates);
  }

  async function toggleCropMode() {
    const newCrop = !cropModeEnabled;
    await updateOverlaySetting({ crop: newCrop });
    void captureEvent("crop_mode_toggled", { enabled: newCrop });

    if (newCrop && !selectedCropBox) {
      editCropRegion();
    }
  }

  async function toggleCloudOcrMode() {
    const newEnabled = !cloudOcrEnabled;
    await updateOverlaySetting({ serverProcessingEnabled: newEnabled });
    setMode(newEnabled ? "Cloud OCR" : "Local OCR");
    void captureEvent("cloud_ocr_toggled", { enabled: newEnabled });
  }

  function editCropRegion() {
    chrome.runtime.sendMessage(
      { type: "TOGGLE_CROP_OVERLAY_FROM_CONTENT" },
      (res) => {
        if (chrome.runtime.lastError || !res?.ok) {
          console.error(
            chrome.runtime.lastError?.message ||
              res?.error ||
              "Failed to toggle crop overlay.",
          );
        }
      },
    );
  }

  async function scanAgain() {
    if (loading) {
      return;
    }

    await getSettings();
    await screenshot();
  }

  function getViewportCssSize() {
    const vv = window.visualViewport;
    return {
      cssW: Math.round(vv?.width ?? window.innerWidth),
      cssH: Math.round(vv?.height ?? window.innerHeight),
    };
  }

  useEffect(() => {
    void (async () => {
      await getSettings();
      await getSubscriptionStatus();
      await screenshot();
    })();

    return () => {
      window.clearTimeout(overlayChromeTimerRef.current);
      removeLightDomTextLayer();
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = (changes, areaName) => {
      if (areaName !== "sync") {
        return;
      }

      setSettings((currentSettings) => {
        const nextSettings = { ...currentSettings };

        for (const [key, change] of Object.entries(changes)) {
          nextSettings[key] = change.newValue;
        }

        return nextSettings;
      });

      if (changes.serverProcessingEnabled) {
        setMode(
          changes.serverProcessingEnabled.newValue ? "Cloud OCR" : "Local OCR",
        );
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (error || data.length === 0) {
      removeLightDomTextLayer();
      return;
    }

    void renderLightDomTextLayer({
      data,
      scalingFactor,
      crop,
      startX,
      startY,
    });
  }, [data, scalingFactor, crop, startX, startY, error]);

  const selectedCropBox = (() => {
    const xStart = Number(settings.cropXStart);
    const yStart = Number(settings.cropYStart);
    const xEnd = Number(settings.cropXEnd);
    const yEnd = Number(settings.cropYEnd);
    const width = xEnd - xStart;
    const height = yEnd - yStart;

    if (![xStart, yStart, width, height].every(Number.isFinite)) {
      return null;
    }

    if (width <= 0 || height <= 0) {
      return null;
    }

    return { xStart, yStart, width, height };
  })();

  const cropModeEnabled = Boolean(settings.crop);
  const cropBox = cropModeEnabled ? selectedCropBox : null;
  const cloudOcrEnabled = Boolean(settings.serverProcessingEnabled);
  const cloudOcrRemainingCount = getRemainingCloudOcrUses(
    settings.cloudOcrFreeUseCount,
  );
  const showCloudUsage = cloudOcrEnabled && !isSubscribed;
  const scanAgainDisabled =
    loading ||
    (!data.length && !error) ||
    (cropModeEnabled && !selectedCropBox);
  const showOverlayChrome = overlayChromeVisible;

  return (
    <div
      className="font-noto pointer-events-none fixed top-0 left-0 h-screen w-screen"
      style={{ zIndex: 2147483647, fontSize: "16px" }}
    >
      {showOverlayChrome && (
        <button
          type="button"
          aria-label="Close overlay"
          className="text-overlay-text hover:border-overlay-accent/60 hover:text-overlay-accent focus-visible:ring-overlay-accent/70 pointer-events-auto absolute top-[20px] right-[20px] flex h-[48px] w-[48px] cursor-pointer items-center justify-center rounded-full border border-[color:var(--overlay-border)] bg-[var(--overlay-surface)] shadow-[0_18px_48px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md transition-colors duration-150 hover:bg-[var(--overlay-surface-strong)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 focus-visible:outline-none"
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
      )}
      {showOverlayChrome && loading && (
        <div
          className="zhonglens-crop-shimmer border-overlay-accent/70 absolute overflow-hidden border-2 bg-[rgba(3,7,18,0.05)] shadow-[0_0_0_1px_rgba(3,7,18,0.35),0_0_28px_rgba(52,211,153,0.2)]"
          style={{
            top: cropBox?.yStart || 0,
            left: cropBox?.xStart || 0,
            width: cropBox?.width || "100vw",
            height: cropBox?.height || "100vh",
          }}
        />
      )}
      {showOverlayChrome && loading && (
        <div className="text-overlay-text absolute top-[50%] left-[50%] flex min-w-[240px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-lg border border-[color:var(--overlay-border)] bg-[var(--overlay-surface)] px-[22px] py-[20px] text-center shadow-[var(--overlay-shadow)] backdrop-blur-xl">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="text-overlay-accent block animate-spin"
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
          <span className="mt-[12px] text-[15px] leading-[20px] font-medium">
            {status}
          </span>
          <span className="text-overlay-muted mt-[4px] text-[12px] leading-[16px]">
            Using {mode} - Crop {cropModeEnabled ? "enabled" : "disabled"}.
          </span>
          <span className="text-overlay-muted mt-[4px] text-[10px] leading-[16px]">
            {cropBox
              ? "Scan taking too long? Move crop to only include the most important text."
              : "Scan taking too long? Make sure to crop the scanning region."}
          </span>
        </div>
      )}
      {showOverlayChrome && error && (
        <div className="absolute top-[50%] left-[50%] flex max-w-[min(420px,calc(100vw-48px))] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[14px] border border-[color:var(--overlay-border)] bg-[var(--overlay-surface)] px-[22px] py-[18px] text-center shadow-[var(--overlay-shadow)] backdrop-blur-xl">
          <span className="text-[15px] leading-[20px] font-medium text-[#fda4af]">
            {error}
          </span>
        </div>
      )}
      {showOverlayChrome && (
        <OverlayToolbar
          loading={loading}
          cropModeEnabled={cropModeEnabled}
          cloudOcrEnabled={cloudOcrEnabled}
          showCloudUsage={showCloudUsage}
          cloudOcrRemainingCount={cloudOcrRemainingCount}
          scanAgainDisabled={scanAgainDisabled}
          onToggleCropMode={toggleCropMode}
          onEditCropRegion={editCropRegion}
          onToggleCloudOcrMode={toggleCloudOcrMode}
          onScanAgain={scanAgain}
        />
      )}
    </div>
  );
};
