import { X } from "lucide-react";

const TEXT_LAYER_ID = "zhonglens-ocr-text-layer";
const TEXT_LAYER_Z_INDEX = "10000";
const DEFAULT_CAPTION_TEXT_COLOR = "#f8fafc";
export const OCR_TEXT_HOVER_EVENT = "zhonglens:ocr-text-hover";
export const OCR_TEXT_HOVER_END_EVENT = "zhonglens:ocr-text-hover-end";

// Reads the user's OCR caption settings, falling back to the defaults used by
// the extension when a setting has not been saved yet.
async function getCaptionSettings() {
  const settings = await chrome.storage.sync.get([
    "captionTextColor",
    "captionBgEnabled",
  ]);

  return {
    textColor: settings.captionTextColor ?? DEFAULT_CAPTION_TEXT_COLOR,
    bgEnabled: settings.captionBgEnabled ?? true,
  };
}

// Returns the existing light DOM text layer, or creates it the first time OCR
// text needs to be shown on the page.
function getOrCreateTextLayer() {
  let layer = document.getElementById(TEXT_LAYER_ID);

  if (!layer) {
    layer = document.createElement("div");
    layer.id = TEXT_LAYER_ID;
  }

  // Keep OCR text in the real page body. Dictionary popups are also regular
  // body DOM, so this lets them stack above our text with their own z-index.
  if (layer.parentElement !== document.body) {
    document.body.append(layer);
  }

  Object.assign(layer.style, {
    position: "fixed",
    inset: "0",
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: TEXT_LAYER_Z_INDEX,
  });

  return layer;
}

function angleFromQuad(p1, p2) {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];

  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

// Converts one OCR polygon into viewport-based text positioning values. Crop
// offsets are applied before dividing by the screenshot scaling factor.
function getTextBlockLayout({ entry, scalingFactor, crop, startX, startY }) {
  const adjustedPolygon = entry[1].map(([x, y]) => [
    x + (crop ? startX : 0) * scalingFactor,
    y + (crop ? startY : 0) * scalingFactor,
  ]);
  const [x1, y1] = adjustedPolygon[0];
  const [x2, y2] = adjustedPolygon[1];
  const [x3, y3] = adjustedPolygon[2];
  const [x4, y4] = adjustedPolygon[3];

  const boxHeight = Math.sqrt((x4 - x1) ** 2 + (y4 - y1) ** 2);
  const boxWidth = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const angle = angleFromQuad([x1, y1], [x2, y2]);

  if (boxWidth > boxHeight) {
    const fontSize = (boxHeight / scalingFactor) * 0.8;

    return {
      top: y1 / scalingFactor,
      left: x1 / scalingFactor,
      boxWidth: boxWidth / scalingFactor,
      fontSize,
      angle,
      vertical: false,
    };
  } else {
    const fontSize = (boxWidth / scalingFactor) * 0.8;

    return {
      top: y1 / scalingFactor,
      left: x1 / scalingFactor,
      boxWidth: boxWidth / scalingFactor,
      boxHeight: boxHeight / scalingFactor,
      fontSize,
      angle,
      vertical: true,
    };
  }
}

function getViewportHeight() {
  return window.visualViewport?.height ?? window.innerHeight;
}

function shouldHideToolbarForTextSpan(span) {
  const rect = span.getBoundingClientRect();
  const textCenterY = rect.top + rect.height / 2;

  return textCenterY >= getViewportHeight() * (2 / 3);
}

function dispatchTextHover(span) {
  window.dispatchEvent(
    new CustomEvent(OCR_TEXT_HOVER_EVENT, {
      detail: {
        shouldHideToolbar: shouldHideToolbarForTextSpan(span),
      },
    }),
  );
}

function dispatchTextHoverEnd() {
  window.dispatchEvent(new CustomEvent(OCR_TEXT_HOVER_END_EVENT));
}

// Creates one selectable OCR text span in the regular page DOM so popup
// dictionary extensions can hover and read it.
function createTextSpan({ text, layout, textColor, bgEnabled, angle }) {
  const span = document.createElement("span");
  span.textContent = text;

  Object.assign(span.style, {
    position: "absolute",
    top: `${layout.top}px`,
    left: `${layout.left}px`,
    fontSize: `${layout.fontSize}px`,
    letterSpacing: "0px",
    whiteSpace: "pre",
    pointerEvents: "auto",
    userSelect: "text",
    lineHeight: "1",
    fontWeight: "600",
    backgroundColor: bgEnabled ? "rgba(5, 10, 8, 0.8)" : "transparent",
    color: textColor ?? DEFAULT_CAPTION_TEXT_COLOR,
    border: bgEnabled ? "1px solid rgba(52, 211, 153, 0.28)" : "none",
    borderRadius: bgEnabled ? "4px" : "0",
    boxShadow: bgEnabled
      ? "0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
      : "none",
    textShadow: bgEnabled
      ? "0 1px 2px rgba(0, 0, 0, 0.65)"
      : "0 0 2px rgba(0, 0, 0, 0.9), 0 1px 2px rgba(0, 0, 0, 0.85)",
    WebkitTextStroke: bgEnabled ? "0 transparent" : "0.4px rgba(0, 0, 0, 0.85)",
    paddingLeft: "2px",
    paddingRight: bgEnabled ? "2px" : "0",
    transformOrigin: "top left",
    transform: `rotate(${layout.angle}deg)`,
    writingMode: layout.vertical ? "vertical-rl" : "horizontal-tb",
  });

  span.addEventListener("mouseenter", () => {
    dispatchTextHover(span);
  });

  span.addEventListener("mousemove", () => {
    dispatchTextHover(span);
  });

  span.addEventListener("mouseleave", () => {
    dispatchTextHoverEnd();
  });

  return span;
}

// Adjusts letter spacing after the span is in the DOM, matching the old React
// ChildText behavior without needing a duplicate OCR layer.
function fitTextToOcrBox(span, text, boxWidth, boxHeight) {
  const textLength = text.length;

  if (textLength <= 1) {
    return;
  }

  // get the width and height of the placed span
  const computedWidth = span.getBoundingClientRect().width;
  const computedHeight = span.getBoundingClientRect().height;

  let letterSpacing;

  if (computedWidth > computedHeight) {
    const widthDiff = boxWidth - computedWidth;

    // calculate the spacing needed to reach the OCR box length
    // by diving the difference in height with no letter spacing by the number of spaces.
    letterSpacing = widthDiff / (textLength - 1);
  } else {
    const heightDiff = boxHeight - computedHeight;

    // calculate the spacing needed to reach the OCR box length
    // by diving the difference in height with no letter spacing by the number of spaces.
    letterSpacing = heightDiff / (textLength - 1);
  }

  span.style.letterSpacing = `${letterSpacing}px`;
}

// Renders OCR text spans in the regular page DOM. Old spans are cleared first
// so reopening or rescanning cannot duplicate text blocks.
export async function renderLightDomTextLayer({
  data,
  scalingFactor,
  crop,
  startX,
  startY,
}) {
  const layer = getOrCreateTextLayer();
  const { textColor, bgEnabled } = await getCaptionSettings();

  layer.replaceChildren();

  for (const entry of data) {
    const text = entry[0];
    const layout = getTextBlockLayout({
      entry,
      scalingFactor,
      crop,
      startX,
      startY,
    });
    const span = createTextSpan({ text, layout, textColor, bgEnabled });

    layer.append(span);
    fitTextToOcrBox(span, text, layout.boxWidth, layout.boxHeight);
  }
}

// Removes the light DOM text layer completely when the overlay closes, unmounts,
// or finishes with an error/no-text result.
export function removeLightDomTextLayer() {
  document.getElementById(TEXT_LAYER_ID)?.remove();
}
