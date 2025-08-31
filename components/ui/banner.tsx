// /components/ui/banner.tsx
import React from "react";
import { X } from "lucide-react"; // Icona per il pulsante di chiusura (opzionale)

export function Banner({
  message,
  type = "info",
  onClose,
}: {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  onClose?: () => void; // Proprietà opzionale per chiudere il banner
}) {
  const typeStyles: { [key: string]: string } = {
    success: "bg-green-100 text-green-800 border-green-300",
    error: "bg-red-100 text-red-800 border-red-300",
    info: "bg-blue-100 text-blue-800 border-blue-300",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
  };

  return (
    <div
      className={`p-4 flex items-center justify-between rounded border ${typeStyles[type] || typeStyles.info}`}
    >
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-sm text-gray-500 hover:text-gray-800"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
