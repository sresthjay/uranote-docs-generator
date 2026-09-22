"use client";

/**
 * Theme toggle for light / dark mode.
 *
 * The active icon is decided purely through CSS (html.dark class),
 * so the server render and the initial client render always match
 * and no page hydration error occurs.
 */

export default function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;

    const next = !root.classList.contains(
      "dark"
    );

    root.classList.toggle("dark", next);

    try {
      localStorage.setItem(
        "uranote-theme",
        next ? "dark" : "light"
      );
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white p-2 text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50"
    >
      <svg
        className="theme-icon theme-icon-moon h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75 9.75 9.75 0 0 1 8.25 6c0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25 9.75 9.75 0 0 0 12.75 21c3.596 0 6.788-1.945 8.397-4.81l.372-.88Z"
        />
      </svg>

      <svg
        className="theme-icon theme-icon-sun h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
        />
      </svg>
    </button>
  );
}