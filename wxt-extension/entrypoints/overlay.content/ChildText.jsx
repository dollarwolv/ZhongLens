import { useEffect, useLayoutEffect } from "react";
import { useState, useRef } from "react";
import "~/assets/tailwind.content.css";

function ChildText({ entry, scalingFactor, startX, startY, crop }) {
  const [textColor, setTextColor] = useState("#39ff14");
  const [bgEnabled, setBgEnabled] = useState(true);
  const text = entry[0];

  const [[x1, y1], [x2, y2], [x3, y3], [x4, y4]] = entry[1].map(([x, y]) => [
    x + (crop ? startX : 0) * scalingFactor,
    y + (crop ? startY : 0) * scalingFactor,
  ]);

  const boxHeight = y3 - y1;
  const boxWidth = x2 - x1;
  const fontSize = (boxHeight / scalingFactor) * 0.8;

  const [letterSpacing, setLetterSpacing] = useState(0);
  const spanRef = useRef();

  useLayoutEffect(() => {
    const rect = spanRef.current.getBoundingClientRect();
    const computedWidth = rect.width;

    // calculate the difference between the measured box width (with 0px letter spacing) and the OCR box width
    const widthDiff = boxWidth / scalingFactor - computedWidth;

    // calculate the spacing needed to reach the OCR box length
    const textLength = text.length;
    const nSpaces = textLength - 1;
    const newLetterSpacing = widthDiff / nSpaces;

    setLetterSpacing(newLetterSpacing);
  }, []);

  useEffect(() => {
    (async () => {
      const settings = await chrome.storage.sync.get([
        "captionTextColor",
        "captionBgEnabled",
      ]);
      setTextColor(settings.captionTextColor);
      setBgEnabled(settings.captionBgEnabled);
    })();
  }, []);

  return (
    <span
      ref={spanRef}
      className="pointer-events-auto absolute inline-block whitespace-pre"
      style={{
        top: `${y1 / scalingFactor}px`,
        left: `${x1 / scalingFactor}px`,
        fontSize: `${fontSize}px`,
        letterSpacing: `${letterSpacing}px`,
        backgroundColor: bgEnabled ? "white" : "transparent",
        WebkitTextStroke: "0.5px #000000",
        paddingLeft: "2px",
        color: textColor ?? "#39ff14",
      }}
    >
      {text}
    </span>
  );
}

export default ChildText;
