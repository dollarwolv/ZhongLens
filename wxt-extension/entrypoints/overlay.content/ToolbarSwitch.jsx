export default function ToolbarSwitch({
  label,
  active,
  activeIcon,
  inactiveIcon,
  onClick,
  disabled = false,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={`${label} ${active ? "on" : "off"}`}
      title={`${label} ${active ? "on" : "off"}`}
      className="text-overlay-muted hover:text-overlay-text focus-visible:ring-overlay-accent/70 pointer-events-auto flex min-w-[58px] cursor-pointer flex-col items-center justify-center gap-[4px] rounded-full px-[6px] py-[4px] transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45"
      onClick={onClick}
      disabled={disabled}
    >
      <span
        className={`relative flex h-[24px] w-[48px] items-center rounded-full border px-[1px] text-[10px] font-medium transition-colors ${
          active
            ? "border-overlay-accent/70 bg-overlay-accent text-overlay-on-accent"
            : "text-overlay-muted border-white/15 bg-white/8"
        }`}
      >
        <span
          className={`absolute top-[1px] flex size-[20px] items-center justify-center rounded-full bg-[var(--overlay-surface-strong)] shadow transition-[left] ${
            active ? "text-overlay-accent left-[26px]" : "left-[1px]"
          }`}
        >
          {active ? activeIcon : inactiveIcon}
        </span>
      </span>
      <span className="text-[10px] leading-[12px] font-medium">{label}</span>
    </button>
  );
}
