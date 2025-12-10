import React from "react";

const ThreeBackground = () => {
  // The 3D background was causing a crash (blank page) in the current environment.
  // We are using the CSS radial gradient defined in index.css as a fallback.
  // This component is kept to maintain the project structure and allow for future 3D implementation.
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      {/* 3D Background disabled for stability */}
    </div>
  );
};

export default ThreeBackground;
