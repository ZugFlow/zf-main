import React from "react";

interface FocusIconProps {
  focused?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
}

const FocusIcon: React.FC<FocusIconProps> = ({ focused = false, onClick, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title || (focused ? "Rimuovi focus" : "Metti a fuoco")}
    style={{
      background: "none",
      border: "none",
      padding: 0,
      marginLeft: 6,
      cursor: "pointer",
      outline: "none",
      display: "inline-flex",
      alignItems: "center",
      opacity: focused ? 1 : 0.6,
      transition: "opacity 0.2s"
    }}
    tabIndex={0}
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <circle
        cx="10"
        cy="10"
        r="8"
        stroke={focused ? "#6366f1" : "#888"}
        strokeWidth="2"
        fill={focused ? "#6366f1" : "none"}
        opacity={focused ? 1 : 0.5}
      />
      <circle
        cx="10"
        cy="10"
        r="3"
        fill={focused ? "#fff" : "#bbb"}
        opacity={focused ? 1 : 0.7}
      />
    </svg>
  </button>
);

export default FocusIcon;
