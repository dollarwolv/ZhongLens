const overlay = document.createElement("div");
overlay.classList.add("overlay");

const LETTER_SPACING_K = 0.18;

const childText = document.createElement("span");
childText.textContent = "知道我的目标是什么吗";
childText.style.top = "806px";
childText.style.left = "474px";
childText.style.fontSize = "48px";
childText.style.letterSpacing = `${48 * LETTER_SPACING_K}px`;

let alive = true;
window.addEventListener("pagehide", () => {
  alive = false;
});
window.addEventListener("beforeunload", () => {
  alive = false;
});

overlay.append(childText);

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === "b") {
    console.log("button press detected");
    e.preventDefault();
    screenshot();
  }
});

function getViewportCssSize() {
  const vv = window.visualViewport;
  return {
    cssW: Math.round(vv?.width ?? window.innerWidth),
    cssH: Math.round(vv?.height ?? window.innerHeight),
  };
}

function screenshot() {
  if (!alive) return;

  console.log("screenshot initiated");

  const { cssW, cssH } = getViewportCssSize();
  chrome.runtime.sendMessage({ type: "CAPTURE_TAB", cssW, cssH }, (res) => {
    if (!res?.ok) {
      console.log(res?.error);
      return;
    }
    console.log("Downloaded, id:", res.downloadId);
  });
}

document.body.append(overlay);
