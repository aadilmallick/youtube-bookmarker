import React from "react";
import { createRoot } from "react-dom/client";
import "./popup.scss";

const App: React.FC<{}> = () => {
  // TODO: 1. create two tabs: current video, and saved videos
  // TODO 2. Load all saved videos
  const [tab, setTab] = React.useState<"currentVideo" | "savedVideos">(
    "savedVideos"
  );
  return (
    <div>
      {/* tabs */}
      <div className="tabs">
        <div
          className={`current ${tab === "currentVideo" ? "current-tab" : ""}`}
          onClick={() => setTab("currentVideo")}
        >
          Current Video
        </div>
        <div
          className={`saved ${tab === "savedVideos" ? "current-tab" : ""}`}
          onClick={() => setTab("savedVideos")}
        >
          Saved Videos
        </div>
      </div>
    </div>
  );
};

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
root.render(<App />);
