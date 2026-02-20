import { useLayoutEffect } from "react";
import { useState, useRef } from "react";
import "~/assets/tailwind.content.css";

function ChildText({ entry, scalingFactor, startX, startY, crop }) {
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

  return (
    <span
      ref={spanRef}
      className="text-neon-green pointer-events-auto absolute whitespace-pre"
      style={{
        top: `${y1 / scalingFactor}px`,
        left: `${x1 / scalingFactor}px`,
        fontSize: `${fontSize}px`,
        letterSpacing: `${letterSpacing}px`,
      }}
    >
      {text}
    </span>
  );
}

export default ChildText;
