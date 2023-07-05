import React from "react";
import { createRoot } from "react-dom/client";
import "./popup.scss";
import { CurrentVideo } from "./CurrentVideo";
import { SavedVideos } from "./SavedVideos";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App: React.FC<{}> = () => {
  const [tab, setTab] = React.useState<"currentVideo" | "savedVideos">(
    "currentVideo"
  );
  return (
    <>
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
      {tab === "currentVideo" ? <CurrentVideo /> : <SavedVideos />}
      <ToastContainer />
    </>
  );
};

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
root.render(<App />);
