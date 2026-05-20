import {
  Cloud,
  CloudOff,
  Crop,
  Maximize2,
  Minimize2,
  PencilRuler,
  RefreshCw,
  X,
} from "lucide-react";
import ToolbarIconButton from "./ToolbarIconButton";
import ToolbarSwitch from "./ToolbarSwitch";

export default function OverlayToolbar({
  loading,
  cropModeEnabled,
  cloudOcrEnabled,
  showCloudUsage,
  cloudOcrRemainingCount,
  scanAgainDisabled,
  hidden,
  onToggleCropMode,
  onEditCropRegion,
  onToggleCloudOcrMode,
  onScanAgain,
  onHiddenChange,
}) {
  return (
    <>
      <div
        aria-hidden={hidden}
        inert={hidden ? "" : undefined}
        className={`absolute bottom-[24px] left-1/2 flex max-w-[calc(100vw-32px)] origin-bottom -translate-x-1/2 flex-col items-center justify-between gap-[6px] rounded-[28px] border border-[color:var(--overlay-border)] bg-[var(--overlay-surface)] px-[16px] py-[10px] shadow-[var(--overlay-shadow)] backdrop-blur-xl transition-[opacity,transform] duration-200 ease-out ${
          hidden
            ? "pointer-events-none scale-75 opacity-0"
            : "pointer-events-auto scale-100 opacity-100"
        }`}
      >
        <button
          type="button"
          aria-label="Collapse OCR controls"
          title="Collapse OCR controls"
          className="text-overlay-muted hover:border-overlay-accent/50 hover:text-overlay-text focus-visible:ring-overlay-accent/70 absolute top-[-6px] right-[-6px] flex size-[24px] cursor-pointer items-center justify-center rounded-full border border-white/15 bg-[var(--overlay-surface-strong)] shadow-[0_8px_20px_rgba(0,0,0,0.32)] transition-colors hover:bg-white/12 focus-visible:ring-2 focus-visible:outline-none"
          onClick={() => {
            void onHiddenChange(true);
          }}
        >
          <Minimize2 className="size-[12px]" />
        </button>
        <div className="flex items-center gap-[8px]">
          <ToolbarSwitch
            label="Crop"
            active={cropModeEnabled}
            activeIcon={<Crop className="size-[13px]" />}
            inactiveIcon={<X className="size-[13px]" />}
            disabled={loading}
            onClick={() => {
              void onToggleCropMode();
            }}
          />
          {cropModeEnabled && (
            <div className="flex flex-col items-center justify-between gap-[2px]">
              <ToolbarIconButton
                label="Edit crop region"
                onClick={onEditCropRegion}
                size={"28px"}
                disabled={loading}
              >
                <PencilRuler className="size-[18px]" />
              </ToolbarIconButton>
              <span
                className={`text-overlay-muted text-[10px] ${
                  loading ? "opacity-45" : ""
                }`}
              >
                Edit crop
              </span>
            </div>
          )}
          <ToolbarSwitch
            label="Cloud"
            active={cloudOcrEnabled}
            activeIcon={<Cloud className="size-[13px]" />}
            inactiveIcon={<CloudOff className="size-[13px]" />}
            badge={showCloudUsage ? cloudOcrRemainingCount : null}
            disabled={loading}
            onClick={() => {
              void onToggleCloudOcrMode();
            }}
          />
          <ToolbarIconButton
            label="Scan again"
            disabled={scanAgainDisabled}
            size={"44px"}
            onClick={() => {
              void onScanAgain();
            }}
          >
            <RefreshCw
              className={`size-[18px] ${loading ? "animate-spin" : ""}`}
            />
          </ToolbarIconButton>
        </div>
        {showCloudUsage && (
          <span className="text-overlay-muted max-w-full truncate px-[8px] text-center text-[10px] leading-[14px]">
            {cloudOcrRemainingCount} free cloud scans left. Upgrade to supporter
            for unlimited scans.
          </span>
        )}
      </div>
      <button
        type="button"
        aria-label="Show OCR controls"
        title="Show OCR controls"
        aria-hidden={!hidden}
        tabIndex={hidden ? 0 : -1}
        className={`text-overlay-muted hover:border-overlay-accent/50 hover:text-overlay-text focus-visible:ring-overlay-accent/70 absolute bottom-[24px] left-1/2 flex h-[28px] w-[40px] origin-bottom -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border border-[color:var(--overlay-border)] bg-[var(--overlay-surface)] shadow-[var(--overlay-shadow)] backdrop-blur-xl transition-[background-color,border-color,color,opacity,transform] duration-200 ease-out hover:bg-[var(--overlay-surface-strong)] focus-visible:ring-2 focus-visible:outline-none ${
          hidden
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-75 opacity-0"
        }`}
        onClick={() => {
          void onHiddenChange(false);
        }}
      >
        <Maximize2 className="size-[12px]" />
      </button>
    </>
  );
}
