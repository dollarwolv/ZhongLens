export default function ToolbarIconButton({
  label,
  onClick,
  disabled = false,
  size,
  children,
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className="text-overlay-muted hover:border-overlay-accent/50 hover:text-overlay-text focus-visible:ring-overlay-accent/70 pointer-events-auto flex size-[24px] cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/8 transition-colors hover:bg-white/12 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45"
      onClick={onClick}
      style={{ width: size, height: size }}
    >
      {children}
    </button>
  );
}
