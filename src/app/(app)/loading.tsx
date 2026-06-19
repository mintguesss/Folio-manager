export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full bg-gradient-to-r from-sky-400 to-violet-500 p-0.5">
        <div className="h-full w-full rounded-full bg-[#050712]" />
      </div>
    </div>
  );
}
