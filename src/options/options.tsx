import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./options.scss";
import {
  getSync,
  storeSync,
  defaultSyncOptions,
  getSyncBookmarks,
} from "../utils/storage";
import { uploadToGist, downloadFromGist } from "../utils/gistSync";

// Add this type for options
interface SyncOptions {
  gistId: string;
  gistToken: string;
}

const GIST_FILENAME = "youtube-bookmarks.json";

const App: React.FC<{}> = () => {
  const [gistId, setGistId] = useState("");
  const [gistToken, setGistToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Load saved options on mount
  useEffect(() => {
    getSync(["options"]).then((data) => {
      const opts = (data.options || defaultSyncOptions.options) as SyncOptions;
      setGistId(opts.gistId || "");
      setGistToken(opts.gistToken || "");
    });
  }, []);

  // Save options to sync storage
  const saveOptions = async () => {
    setLoading(true);
    setStatus(null);
    try {
      await storeSync({ options: { gistId, gistToken } });
      setStatus("Options saved!");
    } catch (e: any) {
      setStatus("Failed to save options: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Upload bookmarks to Gist
  const handleUpload = async () => {
    const shouldUpload = confirm(
      "Are you sure you want to upload your bookmarks to the gist? This will overwrite the existing bookmarks in the gist."
    );
    if (!shouldUpload) return;
    setLoading(true);
    setStatus(null);
    try {
      if (!gistId || !gistToken) throw new Error("Gist ID and Token required");
      const videos = await getSyncBookmarks();
      await uploadToGist({
        gistId,
        filename: GIST_FILENAME,
        content: JSON.stringify(videos, null, 2),
        token: gistToken,
      });
      setStatus("Bookmarks uploaded to Gist!");
    } catch (e: any) {
      setStatus("Upload failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Download bookmarks from Gist and overwrite local
  const handleDownload = async () => {
    const shouldDownload = confirm(
      "Are you sure you want to download your bookmarks from the gist? This will overwrite the existing bookmarks in your local storage."
    );
    if (!shouldDownload) return;
    setLoading(true);
    setStatus(null);
    try {
      if (!gistId || !gistToken) throw new Error("Gist ID and Token required");
      const content = await downloadFromGist({
        gistId,
        filename: GIST_FILENAME,
        token: gistToken,
      });
      const videos = JSON.parse(content);
      await storeSync({ videos });
      setStatus("Bookmarks downloaded and local storage updated!");
    } catch (e: any) {
      setStatus("Download failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="options-container"
      style={{
        maxWidth: 500,
        margin: "2rem auto",
        padding: 24,
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 2px 8px #0001",
      }}
    >
      <h2>YouTube Bookmarker Sync Options</h2>
      <p>
        To sync your bookmarks across accounts and devices, you can connect your
        bookmarks to a github gist by following these steps:
      </p>
      <ol>
        <li>
          Create a new github gist. The filename should be{" "}
          <code>youtube-bookmarks.json</code>, and yes, it must be exactly that.
        </li>
        <li>Copy the gist ID</li>
        <li>Paste the gist ID into the Gist ID field below</li>
        <li>Create a new github personal access token with gist access</li>
        <li>Copy the token</li>
        <li>Paste the token into the GitHub Access Token field below</li>
        <li>Click the Save Options button</li>
        <li>
          Click the Upload Sync button to upload your bookmarks to the gist
        </li>
        <li>
          Click the Download Sync button to download your bookmarks from the
          gist
        </li>
      </ol>
      <p style={{ marginBottom: 16 }}>
        The buttons above serve the following purposes:
        <br />
        <br />
        <strong>Save Options</strong> - Saves your Gist ID and GitHub token to
        be used for syncing
        <br />
        <br />
        <strong>Upload Sync</strong> - Pushes your current local bookmarks to
        the remote gist, overwriting whatever is stored there. Use this when you
        want to update the remote copy with your local changes.
        <br />
        <br />
        <strong>Download Sync</strong> - Pulls the bookmarks stored in the
        remote gist and overwrites your local storage with them. Use this when
        you want to get the latest changes from another device.
      </p>
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="gistId">Gist ID:</label>
        <input
          id="gistId"
          type="text"
          value={gistId}
          onChange={(e) => setGistId(e.target.value)}
          style={{ width: "100%", marginTop: 4 }}
          disabled={loading}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="gistToken">GitHub Access Token:</label>
        <input
          id="gistToken"
          type="password"
          value={gistToken}
          onChange={(e) => setGistToken(e.target.value)}
          style={{ width: "100%", marginTop: 4 }}
          disabled={loading}
        />
      </div>
      <button
        onClick={saveOptions}
        disabled={loading}
        style={{ marginRight: 8 }}
      >
        Save Options
      </button>
      <button
        onClick={handleUpload}
        disabled={loading}
        style={{ marginRight: 8 }}
      >
        Upload Sync
      </button>
      <button onClick={handleDownload} disabled={loading}>
        Download Sync
      </button>
      {status && (
        <div
          style={{
            marginTop: 16,
            color: status.includes("failed") ? "#c00" : "#080",
          }}
        >
          {status}
        </div>
      )}

      {/* Import JSON section */}
      <div style={{ marginTop: 32 }}>
        <h3>Import Bookmarks from JSON</h3>
        <input
          type="file"
          accept="application/json,.json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (event) => {
              try {
                const text = event.target?.result as string;
                const data = JSON.parse(text);
                if (!Array.isArray(data))
                  throw new Error("Invalid format: root should be an array");
                // Optionally: validate array items are Video objects
                // TODO: validate array items are Video objects
                // Validate each item in the array is a Video object
                for (const item of data) {
                  if (typeof item !== "object" || item === null) {
                    throw new Error(
                      "Invalid format: array items must be objects"
                    );
                  }
                  if (typeof item.id !== "string") {
                    throw new Error(
                      "Invalid format: video must have string id"
                    );
                  }
                  if (typeof item.title !== "string") {
                    throw new Error(
                      "Invalid format: video must have string title"
                    );
                  }
                  if (!Array.isArray(item.timestamps)) {
                    throw new Error(
                      "Invalid format: video must have timestamps array"
                    );
                  }
                  // Validate each timestamp
                  for (const timestamp of item.timestamps) {
                    if (typeof timestamp.time !== "number") {
                      throw new Error(
                        "Invalid format: timestamp must have number time"
                      );
                    }
                    if (typeof timestamp.label !== "string") {
                      throw new Error(
                        "Invalid format: timestamp must have string label"
                      );
                    }
                  }
                }
                const shouldImport = confirm(
                  "Are you sure you want to import these bookmarks? This will overwrite your current local bookmarks."
                );
                if (!shouldImport) return;
                setLoading(true);
                setStatus(null);
                await storeSync({ videos: data });
                setStatus("Bookmarks imported from JSON file!");
              } catch (e: any) {
                setStatus("Import failed: " + e.message);
              } finally {
                setLoading(false);
              }
            };
            reader.onerror = () => {
              setStatus("Failed to read file");
            };
            reader.readAsText(file);
          }}
          disabled={loading}
        />
      </div>
    </div>
  );
};

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
root.render(<App />);
