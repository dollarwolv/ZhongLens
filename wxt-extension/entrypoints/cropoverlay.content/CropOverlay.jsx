import "react-resizable/css/styles.css";
import { Resizable } from "react-resizable";
import { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";

function CropOverlay() {
  const [dims, setDims] = useState({ width: 200, height: 200 });
  const [pos, setPos] = useState({ x: 200, y: 200 });
  const [hydrated, setHydrated] = useState(false);

  function getViewportCssSize() {
    const vv = window.visualViewport;
    return {
      cssW: Math.round(vv?.width ?? window.innerWidth),
      cssH: Math.round(vv?.height ?? window.innerHeight),
    };
  }

  const { cssW, cssH } = getViewportCssSize();

  const childRef = useRef();

  function onResize(e, { node, size, handle }) {
    setDims({ width: size.width, height: size.height });
  }

  function handleDrag(e, data) {
    setPos({ x: data.x, y: data.y });
  }

  function saveArea() {
    chrome.storage.sync.set({
      cropXStart: pos.x,
      cropYStart: pos.y,
      cropXEnd: pos.x + dims.width,
      cropYEnd: pos.y + dims.height,
    });
  }

  useEffect(() => {
    chrome.storage.sync.get(
      ["cropXStart", "cropYStart", "cropXEnd", "cropYEnd"],
      (items) => {
        const width = (items.cropXEnd ?? 200) - (items.cropXStart ?? 100);
        const height = (items.cropYEnd ?? 200) - (items.cropYStart ?? 100);

        const xRaw = items.cropXStart ?? 100;
        const yRaw = items.cropYStart ?? 200;

        const x = Math.max(0, Math.min(xRaw, cssW - width));
        const y = Math.max(0, Math.min(yRaw, cssH - height));

        setDims({ width, height });
        setPos({ x, y });
        setHydrated(true);
      },
    );
  }, []);

  return (
    <div className="bg-white-10 fixed top-0 left-0 z-999 h-screen w-screen">
      <Draggable
        position={pos}
        nodeRef={childRef}
        onDrag={handleDrag}
        onStop={saveArea}
        cancel=".react-resizable-handle"
      >
        <div ref={childRef} className={`${hydrated ? "show" : "hidden"}`}>
          <Resizable
            height={dims.height}
            width={dims.width}
            onResize={onResize}
            onResizeStop={saveArea}
            resizeHandles={["se"]}
          >
            <div
              style={{ width: `${dims.width}px`, height: `${dims.height}px` }}
              className="border-neon-green z-1000 flex cursor-grab items-center justify-center border-4 shadow-[0_0_999px_60px]"
            >
              <span className="text-neon-green">
                this is the region where OCR will be performed. drag/resize to
                adjust.
              </span>
            </div>
          </Resizable>
        </div>
      </Draggable>
    </div>
  );
}

export default CropOverlay;
