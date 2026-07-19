interface LoaderProps {
  fullPage?: boolean;
  label?: string;
  className?: string;
}

export default function Loader({
  fullPage = false,
  label = "Loading...",
  className = "",
}: LoaderProps) {
  const content = (
    <div
      className={`inline-flex items-center gap-3 text-[#cbd8c2] ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-green-700/30 border-t-green-300" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );

  if (!fullPage) {
    return content;
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4 py-16">
      {content}
    </div>
  );
}
