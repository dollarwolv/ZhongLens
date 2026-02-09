function createChild(textContent, xStart, yStart, boxHeight) {
  const LETTER_SPACING_K = 0.18;
  const childText = document.createElement("span");
  childText.textContent = textContent;
  childText.style.top = `${yStart}px`;
  childText.style.left = `${xStart}px`;
  childText.style.fontSize = `${boxHeight * 0.8}px`;
  childText.style.letterSpacing = `${48 * LETTER_SPACING_K}px`;
  const overlay = document.getElementById("subtitle-overlay-chinese-ocr");
  overlay.append(childText);
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

function drawOCROverlay(result) {
  createOverlay();

  texts = result.rec_texts;
  bboxes = result.rec_polys;

  //TO DO: Add orientation support
  for (i = 0; i < texts.length; i++) {
    const text = texts[i];
    console.log(text);
    const [[x1, y1], [x2, y2], [x3, y3], [x4, y4]] = bboxes[i];
    createChild(text, x1, y1, y3 - y1);
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
    drawOCROverlay(res.result);
  });

  // createOverlay();
  // createChild("知道我的目标是什么吗", 474, 806, 60);
}
