const overlay = document.createElement("div");
overlay.classList.add("overlay");

const childText = document.createElement("span");
childText.textContent = "你好世界";
childText.style.position = "absolute";
childText.style.top = "100px";
childText.style.left = "42px";

overlay.append(childText);

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === "b") {
    e.preventDefault();
    screenshot();
  }
});

function screenshot() {
  chrome.runtime.sendMessage({ type: "CAPTURE_TAB" }, (res) => {
    if (!res?.ok) {
      console.error(res?.error);
      return;
    }
    console.log("Downloaded, id:", res.downloadId);
  });
}

document.body.append(overlay);
