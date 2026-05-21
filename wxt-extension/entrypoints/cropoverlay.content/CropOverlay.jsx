import "react-resizable/css/styles.css";
import { Resizable } from "react-resizable";
import { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import { Button } from "@/components/ui/button";

export default ({ onClose }) => {
  const [dims, setDims] = useState({ width: 200, height: 200 });
  const [pos, setPos] = useState({ x: 200, y: 200 });
  const [hydrated, setHydrated] = useState(false);
  const [crop, setCrop] = useState(false);

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

  function enableCrop() {
    try {
      chrome.storage.sync.set({ crop: true });
      setCrop(true);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    chrome.storage.sync.get(
      ["cropXStart", "cropYStart", "cropXEnd", "cropYEnd", "crop"],
      (items) => {
        const width = (items.cropXEnd ?? 200) - (items.cropXStart ?? 100);
        const height = (items.cropYEnd ?? 200) - (items.cropYStart ?? 100);

        const xRaw = items.cropXStart ?? 100;
        const yRaw = items.cropYStart ?? 200;

        const x = Math.max(0, Math.min(xRaw, cssW - width));
        const y = Math.max(0, Math.min(yRaw, cssH - height));

        setDims({ width, height });
        setPos({ x, y });
        setCrop(items.crop);
        setHydrated(true);
      },
    );
  }, []);

  return (
    <div
      className="font-noto pointer-events-none fixed top-0 left-0 h-screen w-screen bg-[rgba(3,7,18,0.18)] backdrop-blur-[0.5px]"
      style={{ fontSize: "16px" }}
    >
      <Draggable
        position={pos}
        nodeRef={childRef}
        onDrag={handleDrag}
        onStop={saveArea}
        cancel=".react-resizable-handle"
      >
        <div
          ref={childRef}
          className={`${hydrated ? "show" : "hidden"} pointer-events-auto`}
        >
          <Resizable
            height={dims.height}
            width={dims.width}
            onResize={onResize}
            onResizeStop={saveArea}
            resizeHandles={["se"]}
          >
            <div
              style={{ width: `${dims.width}px`, height: `${dims.height}px` }}
              className="border-overlay-accent/80 z-1000 flex cursor-grab items-center justify-center border-2 border-dashed bg-[rgba(5,10,8,0.12)] p-[8px] shadow-[0_0_0_9999px_rgba(2,6,23,0.54),0_22px_60px_rgba(0,0,0,0.36),0_0_32px_rgba(52,211,153,0.22)] backdrop-blur-[0.5px]"
            >
              <span className="text-overlay-text max-w-[36ch] rounded-[8px] border border-[color:var(--overlay-border)] bg-[var(--overlay-surface)] px-[12px] py-[8px] text-center text-[13px] leading-[18px] shadow-[0_12px_32px_rgba(0,0,0,0.32)] backdrop-blur-md">
                Character recognition will only be performed in this region.
                This both helps performance and accuracy. Drag/Resize to adjust.
              </span>
            </div>
          </Resizable>
        </div>
      </Draggable>
      <Button
        onClick={onClose}
        size={"lg"}
        className="bg-overlay-accent text-overlay-on-accent hover:bg-overlay-accent-strong pointer-events-auto absolute bottom-1/20 left-1/2 h-[44px] -translate-x-1/2 gap-[8px] rounded-[10px] px-[24px] py-[8px] text-[16px] font-semibold shadow-[0_32px_72px_rgba(16,185,129,0.26)]"
      >
        Done
      </Button>
      <div className="absolute top-1/20 left-1/2 flex -translate-x-1/2 flex-col items-center justify-center gap-[12px] rounded-[14px] border border-[color:var(--overlay-border)] bg-[var(--overlay-surface)] px-[18px] py-[14px] text-center shadow-[var(--overlay-shadow)] backdrop-blur-xl">
        <span className="text-overlay-muted text-[13px] leading-[18px]">
          Cropping is currently {crop ? "enabled" : "disabled"}.
        </span>
        {!crop && (
          <Button
            onClick={enableCrop}
            className="bg-overlay-accent text-overlay-on-accent hover:bg-overlay-accent-strong pointer-events-auto h-[36px] gap-[8px] rounded-[8px] px-[16px] py-[8px] text-[14px] font-medium"
          >
            Click here to enable cropping.
          </Button>
        )}
      </div>
    </div>
  );
};
