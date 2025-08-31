import React from "react";

export function FormButton({ text }: { text: string }) {
  return (
    <button
      type="submit"
      className="w-full py-2 px-4 text-white rounded-md shadow-sm focus:outline-none"
      style={{
        backgroundColor: "rgb(91, 146, 191)",
      }}
    >
      {text}
    </button>
  );
}
