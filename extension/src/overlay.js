const overlay = document.createElement("div");
overlay.classList.add("overlay");

const childText = document.createElement("span");
childText.textContent = "hi there";
childText.style.position = "relative";
childText.style.top = "1603px";
childText.style.left = "822px";

overlay.append(childText);
document.body.append(overlay);
