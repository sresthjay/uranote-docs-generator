"use client";

import { useRef, useState } from "react";

import {
  ExportPayload,
  applyExportData,
  downloadExportFile,
  validateExportData,
} from "@/lib/export-import";

type Status =
  | { type: "idle" }
  | { type: "error"; message: string }
  | { type: "success"; message: string };

export default function DataTransferControls() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<Status>({
    type: "idle",
  });

  const [pendingImport, setPendingImport] =
    useState<ExportPayload | null>(null);

  function handleExport() {
    downloadExportFile();

    setPendingImport(null);

    setStatus({
      type: "success",
      message:
        "Backup file downloaded. Share it to another device and import it there.",
    });
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const text =
        typeof reader.result === "string"
          ? reader.result
          : "";

      const result = validateExportData(text);

      if (!result.ok) {
        setPendingImport(null);
        setStatus({
          type: "error",
          message: result.error,
        });
        return;
      }

      setPendingImport(result.data);
      setStatus({ type: "idle" });
    };

    reader.onerror = () => {
      setPendingImport(null);
      setStatus({
        type: "error",
        message:
          "Could not read the selected file.",
      });
    };

    reader.readAsText(file);

    event.target.value = "";
  }

  function handleImport(
    mode: "merge" | "replace"
  ) {
    if (!pendingImport) {
      return;
    }

    const count = applyExportData(
      pendingImport,
      mode
    );

    setPendingImport(null);

    setStatus({
      type: "success",
      message:
        mode === "merge"
          ? `Imported ${count} booking(s) and kept existing bookings.`
          : `Imported ${count} booking(s) and replaced existing bookings.`,
    });
  }

  const importCount = pendingImport
    ? pendingImport.data.bookings.length
    : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50"
        >
          Export Data
        </button>

        <button
          type="button"
          onClick={() =>
            fileInputRef.current?.click()
          }
          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50"
        >
          Import Data
        </button>
      </div>

      {status.type === "error" && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {status.message}
        </p>
      )}

      {status.type === "success" && (
        <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {status.message}
        </p>
      )}

      {pendingImport && (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-4">
          <p className="text-sm font-semibold text-blue-900">
            Backup is valid: {importCount}{" "}
            {importCount === 1
              ? "booking"
              : "bookings"}{" "}
            found.
          </p>

          <p className="mt-1 text-sm text-blue-800">
            How do you want to restore this data?
          </p>

          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                handleImport("merge")
              }
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Merge
            </button>

            <button
              type="button"
              onClick={() =>
                handleImport("replace")
              }
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50"
            >
              Replace all
            </button>

            <button
              type="button"
              onClick={() =>
                setPendingImport(null)
              }
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}