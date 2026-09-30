interface ImagePlaceholderProps {
  label: string;
  filename: string;
  className?: string;
  tone?: "light" | "dark";
  rounded?: string;
  bordered?: boolean;
}

/**
 * Stands in for real photography that hasn't been supplied yet. Deliberately
 * labeled (not a fake photo) so it's obvious what asset needs to be dropped in,
 * and where — swap by replacing the call site with a real <img>/<Image>.
 *
 * `className` controls sizing/aspect-ratio only; border radius and border are
 * separate props so callers can't accidentally fight the defaults via class
 * concatenation.
 */
export default function ImagePlaceholder({
  label,
  filename,
  className = "",
  tone = "light",
  rounded = "rounded-2xl",
  bordered = true,
}: ImagePlaceholderProps) {
  const isDark = tone === "dark";
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 p-6 text-center ${rounded} ${
        bordered ? "border-2 border-dashed" : ""
      } ${
        isDark ? "border-white/25 bg-white/5 text-white/70" : "border-stone-300 bg-stone-100 text-stone-400"
      } ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="size-8 opacity-70"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-5-5L5 21" />
      </svg>
      {label && <span className="text-sm font-medium">{label}</span>}
      {filename && (
        <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${isDark ? "bg-white/10" : "bg-white"}`}>
          {filename}
        </span>
      )}
    </div>
  );
}
