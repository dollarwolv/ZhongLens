function createChild(
  textContent,
  xStart,
  yStart,
  boxHeight,
  boxWidth,
  scalingFactor,
) {
  const childText = document.createElement("span");
  childText.textContent = textContent;

  const fontSize = (boxHeight / scalingFactor) * 0.8;
  const initialLetterSpacing = 0;

  let styles = {
    whiteSpace: "pre",
    top: `${yStart / scalingFactor}px`,
    left: `${xStart / scalingFactor}px`,
    fontSize: `${fontSize}px`,
    letterSpacing: `${initialLetterSpacing}px`,
  };

  Object.assign(childText.style, styles);

  // measure width of box to find correct spacing
  let { width: computedWidth, height: computedHeight } = measureText(
    textContent,
    styles,
  );

  // calculate the difference between the measured box width (with 0px letter spacing) and the OCR box width
  let widthDiff = boxWidth / scalingFactor - computedWidth;

  // calculate the spacing needed to reach the OCR box length
  const textLength = textContent.length;
  const nSpaces = textLength - 1;
  const newLetterSpacing = widthDiff / nSpaces;
  childText.style.letterSpacing = `${newLetterSpacing}px`;

  const overlay = document.getElementById("subtitle-overlay-chinese-ocr");
  overlay.append(childText);
}

function measureText(text, styles = {}) {
  // create a new hidden span with the same text content and styles
  const span = document.createElement("span");
  span.textContent = text;
  span.style.position = "absolute";
  span.style.visibility = "hidden";
  span.style.whiteSpace = "pre";
  Object.assign(span.style, styles);
  document.body.appendChild(span);

  // measure height and width and remove from DOM
  const rect = span.getBoundingClientRect();
  document.body.removeChild(span);

  return { width: rect.width, height: rect.height };
}

function createOverlay() {
  const overlay = document.getElementById("subtitle-overlay-chinese-ocr");
  if (overlay) return;
  const newOverlay = document.createElement("div");
  newOverlay.id = "subtitle-overlay-chinese-ocr";
  newOverlay.classList.add("chinese-ocr-overlay");
  document.body.append(newOverlay);
}

function removeOverlay() {
  const overlay = document.getElementById("subtitle-overlay-chinese-ocr");
  if (overlay) {
    document.body.removeChild(overlay);
  }
}

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === "b") {
    e.preventDefault();
    screenshot();
  }
  if (e.ctrlKey && e.key.toLowerCase() === "l") {
    e.preventDefault();
    removeOverlay();
  }
});

function getViewportCssSize() {
  const vv = window.visualViewport;
  return {
    cssW: Math.round(vv?.width ?? window.innerWidth),
    cssH: Math.round(vv?.height ?? window.innerHeight),
  };
}

function drawOCROverlay(result, scalingFactor) {
  createOverlay();

  texts = result.rec_texts;
  bboxes = result.rec_polys;

  for (i = 0; i < texts.length; i++) {
    const text = texts[i];
    console.log(text);
    const [[x1, y1], [x2, y2], [x3, y3], [x4, y4]] = bboxes[i];
    createChild(text, x1, y1, y3 - y1, x2 - x1, scalingFactor);
  }
}

function screenshot() {
  console.log("screenshot initiated");

  const { cssW, cssH } = getViewportCssSize();

  chrome.runtime.sendMessage({ type: "CAPTURE_TAB", cssW, cssH }, (res) => {
    if (!res?.ok) {
      console.log(res?.error);
      return;
    }
    console.log("result angekommen: " + res);
    drawOCROverlay(res.result, res.scalingFactor);
  });
}
