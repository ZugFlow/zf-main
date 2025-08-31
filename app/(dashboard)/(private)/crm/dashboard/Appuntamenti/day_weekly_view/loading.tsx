
import React from "react";

// Ghost card skeleton loader styles
const ghostCardStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, #f3f3f3 25%, #e0e0e0 50%, #f3f3f3 75%)",
  backgroundSize: "200% 100%",
  animation: "ghost-loading 1.2s ease-in-out infinite",
  borderRadius: 12,
  minHeight: 120,
  marginBottom: 16,
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: 20,
  width: 320,
  maxWidth: "100%",
};

const avatarStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  background: "#e0e0e0",
  marginBottom: 8,
};

const lineStyle = (w: string | number) => ({
  height: 14,
  width: w,
  background: "#e0e0e0",
  borderRadius: 6,
  marginBottom: 8,
});

// Keyframes for shimmer effect
const styleSheet = `
@keyframes ghost-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}`;
if (typeof document !== "undefined" && !document.getElementById("ghost-loading-keyframes")) {
  const style = document.createElement("style");
  style.id = "ghost-loading-keyframes";
  style.innerHTML = styleSheet;
  document.head.appendChild(style);
}


// Simulated calendar skeleton loader
const hourRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 0,
  height: 36,
  borderBottom: "1px solid #ececec",
  background: "#fafbfc",
};
const hourLabelStyle: React.CSSProperties = {
  width: 48,
  color: "#bdbdbd",
  fontSize: 13,
  textAlign: "right",
  paddingRight: 12,
  userSelect: "none",
};
const cellStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 80,
  minHeight: 32,
  margin: 4,
  borderRadius: 8,
  background: "linear-gradient(90deg, #f3f3f3 25%, #e0e0e0 50%, #f3f3f3 75%)",
  backgroundSize: "200% 100%",
  animation: "ghost-loading 1.2s ease-in-out infinite",
};
const headerCellStyle: React.CSSProperties = {
  ...cellStyle,
  height: 28,
  background: "#f5f5f5",
  animation: undefined,
  fontWeight: 600,
  color: "#bdbdbd",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};


// Ghost for the real Day calendar: header, navigation, and grid
const navButtonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  background: '#f3f3f3',
  border: 'none',
  margin: '0 8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#bdbdbd',
  fontSize: 18,
  cursor: 'not-allowed',
};
const dateGhostStyle: React.CSSProperties = {
  width: 120,
  height: 24,
  borderRadius: 8,
  background: 'linear-gradient(90deg, #f3f3f3 25%, #e0e0e0 50%, #f3f3f3 75%)',
  backgroundSize: '200% 100%',
  animation: 'ghost-loading 1.2s ease-in-out infinite',
  margin: '0 16px',
};
const memberGhostStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: '#e0e0e0',
  margin: '0 auto 4px',
};
const memberNameGhostStyle: React.CSSProperties = {
  width: 40,
  height: 10,
  borderRadius: 6,
  background: '#e0e0e0',
  margin: '0 auto',
};

const Loading: React.FC = () => {
  // Simulate 4 members and 24 hours (full day)
  const members = ["Mario", "Anna", "Luca", "Sara"];
  const hours = Array.from({ length: 24 }, (_, i) => i); // 0:00 to 23:00

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background: "rgb(249, 250, 251)",
        zIndex: 1000,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top navbar ghost */}
      <div style={{ 
        height: 64, 
        background: "white", 
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 80, height: 20, background: "#e5e7eb", borderRadius: 6 }}></div>
          <div style={{ width: 40, height: 20, background: "#e5e7eb", borderRadius: 6 }}></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, background: "#e5e7eb", borderRadius: 8 }}></div>
          <div style={{ width: 32, height: 32, background: "#e5e7eb", borderRadius: 8 }}></div>
          <div style={{ width: 32, height: 32, background: "#e5e7eb", borderRadius: 8 }}></div>
        </div>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Navigation bar ghost - replica navbar_secondaria_day */}
        <div style={{ 
          height: 64,
          background: "white", 
          borderBottom: "1px solid #e5e7eb",
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: "0 16px"
        }}>
          {/* Left section */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {/* Date navigation */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              background: "#f9fafb", 
              borderRadius: 8, 
              padding: 4,
              gap: 4,
              height: 36
            }}>
              <button style={{...navButtonStyle, width: 28, height: 28, margin: 0}} disabled>{'<'}</button>
              <div style={{
                ...dateGhostStyle,
                width: 140,
                height: 16,
                margin: "0 12px"
              }}></div>
              <button style={{...navButtonStyle, width: 28, height: 28, margin: 0}} disabled>{'>'}</button>
            </div>
            
            {/* Filter button ghost */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#f9fafb",
              padding: "8px 12px",
              borderRadius: 8,
              height: 36
            }}>
              <div style={{ width: 16, height: 16, background: "#d1d5db", borderRadius: 4 }}></div>
              <div style={{ width: 60, height: 12, background: "#d1d5db", borderRadius: 6 }}></div>
            </div>
            
            {/* Members navigation ghost */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              background: "#f9fafb", 
              borderRadius: 8, 
              padding: 4,
              gap: 4,
              height: 36
            }}>
              <button style={{...navButtonStyle, width: 28, height: 28, margin: 0}} disabled>{'<'}</button>
              <button style={{...navButtonStyle, width: 28, height: 28, margin: 0}} disabled>{'>'}</button>
            </div>
          </div>

          {/* Right section */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Zoom controls */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              background: "#f9fafb", 
              borderRadius: 8, 
              padding: 4,
              gap: 4,
              height: 36
            }}>
              <button style={{...navButtonStyle, width: 28, height: 28, margin: 0}} disabled>-</button>
              <button style={{...navButtonStyle, width: 28, height: 28, margin: 0}} disabled>+</button>
            </div>
            
            {/* Members dropdown ghost */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#f9fafb",
              padding: "8px 12px",
              borderRadius: 8,
              height: 36
            }}>
              <div style={{ width: 16, height: 16, background: "#d1d5db", borderRadius: 4 }}></div>
              <div style={{ width: 12, height: 12, background: "#3b82f6", borderRadius: "50%" }}></div>
              <div style={{ width: 80, height: 12, background: "#d1d5db", borderRadius: 6 }}></div>
            </div>
            
            {/* Action buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 36, height: 36, background: "#f9fafb", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 16, height: 16, background: "#d1d5db", borderRadius: 4 }}></div>
              </div>
              <div style={{ width: 36, height: 36, background: "#f9fafb", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 16, height: 16, background: "#d1d5db", borderRadius: 4 }}></div>
              </div>
              <div style={{ width: 36, height: 36, background: "#f9fafb", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 16, height: 16, background: "#d1d5db", borderRadius: 4 }}></div>
              </div>
              <div style={{ width: 36, height: 36, background: "#f9fafb", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 16, height: 16, background: "#d1d5db", borderRadius: 4 }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar content */}
        <div style={{ 
          flex: 1, 
          background: "white",
          overflow: "auto",
          padding: "0 24px 24px 24px"
        }}>
          {/* Members header ghost */}
          <div style={{ 
            display: "flex", 
            alignItems: "flex-end", 
            marginBottom: 16, 
            marginLeft: 60,
            paddingTop: 16,
            position: "sticky",
            top: 0,
            background: "white",
            zIndex: 10
          }}>
            {members.map((m, i) => (
              <div key={i} style={{ 
                flex: 1,
                minWidth: 160,
                textAlign: 'center',
                padding: "0 8px"
              }}>
                <div style={{
                  ...memberGhostStyle,
                  width: 40,
                  height: 40,
                  margin: "0 auto 8px"
                }}></div>
                <div style={{
                  ...memberNameGhostStyle,
                  width: 60,
                  height: 12,
                  margin: "0 auto 4px"
                }}></div>
                <div style={{
                  width: 40,
                  height: 8,
                  background: "#e5e7eb",
                  borderRadius: 4,
                  margin: "0 auto"
                }}></div>
              </div>
            ))}
          </div>

          {/* Calendar rows */}
          {hours.map((h, i) => (
            <div key={i} style={{
              ...hourRowStyle,
              height: 180, // Match the real calendar row height
              alignItems: "stretch",
              borderBottom: "1px solid #f3f4f6",
            }}>
              <div style={{
                ...hourLabelStyle,
                width: 60,
                height: "100%",
                display: "flex",
                alignItems: "flex-start",
                paddingTop: 8,
                fontSize: 12,
                fontWeight: 500
              }}>
                {h.toString().padStart(2, '0')}:00
              </div>
              {members.map((_, j) => (
                <div key={j} style={{
                  flex: 1,
                  minWidth: 160,
                  height: "100%",
                  margin: "0 4px",
                  borderRadius: 8,
                  background: "linear-gradient(90deg, #f9fafb 25%, #f3f4f6 50%, #f9fafb 75%)",
                  backgroundSize: "200% 100%",
                  animation: "ghost-loading 1.5s ease-in-out infinite",
                  border: "1px solid #f3f4f6",
                  position: "relative"
                }}>
                  {/* Simulate some appointment ghosts randomly */}
                  {Math.random() > 0.7 && (
                    <div style={{
                      position: "absolute",
                      top: Math.random() * 40 + 20,
                      left: 8,
                      right: 8,
                      height: Math.random() * 60 + 40,
                      background: "linear-gradient(90deg, #ddd6fe 25%, #c4b5fd 50%, #ddd6fe 75%)",
                      backgroundSize: "200% 100%",
                      animation: "ghost-loading 1.8s ease-in-out infinite",
                      borderRadius: 8,
                      border: "1px solid #c4b5fd"
                    }} />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Loading;
