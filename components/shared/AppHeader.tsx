"use client";

import ThemeToggle from "@/components/shared/ThemeToggle";

export default function AppHeader() {
  return (
    <header className="no-print border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <span className="text-sm font-semibold text-gray-900">
          Uranote Operations
        </span>

        <ThemeToggle />
      </div>
    </header>
  );
}