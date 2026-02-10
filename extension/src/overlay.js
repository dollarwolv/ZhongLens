function createChild(
  textContent,
  xStart,
  yStart,
  boxHeight,
  boxWidth,
  scalingFactor,
) {
  const LETTER_SPACING_K = 0.18;
  const childText = document.createElement("span");
  childText.textContent = textContent;

  const fontSize = (boxHeight / scalingFactor) * 0.8;

  console.log("box height: " + boxHeight);
  console.log("scaling factor: " + scalingFactor);
  console.log("font size: " + fontSize);

  const initialLetterSpacing = 0;

  let styles = {
    whiteSpace: "pre",
    top: `${yStart / scalingFactor}px`,
    left: `${xStart / scalingFactor}px`,
    fontSize: `${fontSize}px`,
    letterSpacing: `${initialLetterSpacing}px`,
  };

  Object.assign(childText.style, styles);
  let { width: computedWidth, height: computedHeight } = measureText(
    textContent,
    styles,
  );

  let widthDiffAbs = Math.abs(boxWidth - computedWidth);
  let widthDiff = boxWidth / scalingFactor - computedWidth;
  // let heightDiff = Math.abs(boxHeight - height)\

  const textLength = textContent.length;
  const nSpaces = textLength - 1;

  const newLetterSpacing = widthDiff / nSpaces;

  styles.letterSpacing = `${newLetterSpacing}px`;
  childText.style.letterSpacing = `${newLetterSpacing}px`;

  console.log("initial letter spacing: " + initialLetterSpacing);
  console.log("applied letter spacing: " + childText.style.letterSpacing);
  console.log("inital measured box width: " + computedWidth);
  let { width: newWidth, height: newHeight } = measureText(textContent, styles);
  console.log("new measured box width: " + newWidth);
  console.log("OCR box width: " + boxWidth);
  console.log(" ");

  const overlay = document.getElementById("subtitle-overlay-chinese-ocr");
  overlay.append(childText);
}

function measureText(text, styles = {}) {
  const span = document.createElement("span");
  span.textContent = text;
  span.style.position = "absolute";
  span.style.visibility = "hidden";
  span.style.whiteSpace = "pre";

  Object.assign(span.style, styles);
  document.body.appendChild(span);
  const rect = span.getBoundingClientRect();
  document.body.removeChild(span);

  return { width: rect.width, height: rect.height };
}

function createOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "subtitle-overlay-chinese-ocr";
  overlay.classList.add("overlay");
  document.body.append(overlay);
}

function removeOverlay(overlay) {
  document.body.removeChild(overlay);
}

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === "b") {
    console.log("button press detected");
    e.preventDefault();
    screenshot();
  }
  if (e.ctrlKey && e.key.toLowerCase() === "l") {
    const overlay = document.getElementById("subtitle-overlay-chinese-ocr");
    if (overlay) {
      e.preventDefault();
      removeOverlay(overlay);
    }
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

  //TO DO: Add orientation support
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

  // createOverlay();
  // createChild("知道我的目标是什么吗", 474, 806, 60);
}
