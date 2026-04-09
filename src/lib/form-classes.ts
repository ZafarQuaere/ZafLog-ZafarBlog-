/** Native <select> — explicit text + option colors for consistent contrast in light/dark. */
export const formSelectClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 shadow-sm outline-none transition " +
  "focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/25 " +
  "dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20 " +
  "[&>option]:bg-white [&>option]:text-zinc-900 dark:[&>option]:bg-zinc-900 dark:[&>option]:text-zinc-100";
