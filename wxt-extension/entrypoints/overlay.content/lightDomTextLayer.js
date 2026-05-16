const TEXT_LAYER_ID = "zhonglens-ocr-text-layer";
const TEXT_LAYER_Z_INDEX = "10000";

// Reads the user's OCR caption settings, falling back to the defaults used by
// the extension when a setting has not been saved yet.
async function getCaptionSettings() {
  const settings = await chrome.storage.sync.get([
    "captionTextColor",
    "captionBgEnabled",
  ]);

  return {
    textColor: settings.captionTextColor ?? "#39ff14",
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

// Converts one OCR polygon into viewport-based text positioning values. Crop
// offsets are applied before dividing by the screenshot scaling factor.
function getTextBlockLayout({ entry, scalingFactor, crop, startX, startY }) {
  const adjustedPolygon = entry[1].map(([x, y]) => [
    x + (crop ? startX : 0) * scalingFactor,
    y + (crop ? startY : 0) * scalingFactor,
  ]);
  const [x1, y1] = adjustedPolygon[0];
  const [x2] = adjustedPolygon[1];
  const [, y3] = adjustedPolygon[2];

  const boxHeight = y3 - y1;
  const boxWidth = x2 - x1;
  const fontSize = (boxHeight / scalingFactor) * 0.8;

  return {
    top: y1 / scalingFactor,
    left: x1 / scalingFactor,
    boxWidth: boxWidth / scalingFactor,
    fontSize,
  };
}

// Creates one selectable OCR text span in the regular page DOM so popup
// dictionary extensions can hover and read it.
function createTextSpan({ text, layout, textColor, bgEnabled }) {
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
    backgroundColor: bgEnabled ? "white" : "transparent",
    color: textColor ?? "#39ff14",
    WebkitTextStroke: "0.5px #000000",
    paddingLeft: "2px",
  });

  return span;
}

// Adjusts letter spacing after the span is in the DOM, matching the old React
// ChildText behavior without needing a duplicate OCR layer.
function fitTextToOcrBox(span, text, boxWidth) {
  const textLength = text.length;

  if (textLength <= 1) {
    return;
  }

  // get the width of the placed span
  const computedWidth = span.getBoundingClientRect().width;
  const widthDiff = boxWidth - computedWidth;

  // calculate the spacing needed to reach the OCR box length
  // by diving the difference in width with no letter spacing by the number of spaces.
  const letterSpacing = widthDiff / (textLength - 1);

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
    fitTextToOcrBox(span, text, layout.boxWidth);
  }
}

// Removes the light DOM text layer completely when the overlay closes, unmounts,
// or finishes with an error/no-text result.
export function removeLightDomTextLayer() {
  document.getElementById(TEXT_LAYER_ID)?.remove();
}
