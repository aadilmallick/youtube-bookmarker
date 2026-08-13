import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./sidepanel.scss";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Video,
  Timestamp,
  getSyncBookmarks,
  addTimestampSync,
  deleteTimestampSync,
  deleteVideoSync,
  editDescriptionSync,
} from "../utils/storage";
import { FaChevronDown, FaTrash, FaEdit, FaPlus, FaExternalLinkAlt } from "react-icons/fa";

const SidePanel: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [expandedVideos, setExpandedVideos] = useState<{ [key: string]: boolean }>({});

  // Add Bookmark form state
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [timestamp, setTimestamp] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Edit Modal State
  const [editingTimestamp, setEditingTimestamp] = useState<{
    videoId: string;
    timestamp: Timestamp;
  } | null>(null);
  const [editDescription, setEditDescription] = useState<string>("");

  const loadVideos = async () => {
    try {
      setLoading(true);
      const bookmarks = await getSyncBookmarks();
      setVideos(bookmarks);
    } catch (e: any) {
      toast.error("Failed to load bookmarks: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === "local" && changes.videos) {
        setVideos(changes.videos.newValue || []);
      }
    };

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    return () => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, []);

  const toggleVideoExpand = (videoId: string) => {
    setExpandedVideos((prev) => ({
      ...prev,
      [videoId]: !prev[videoId],
    }));
  };

  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to parse YouTube Video ID
  const parseVideoId = (urlOrId: string): string => {
    const trimmed = urlOrId.trim();
    if (!trimmed) return "";

    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }

    try {
      const url = new URL(trimmed);
      if (url.hostname.includes("youtube.com")) {
        const v = url.searchParams.get("v");
        if (v) return v;
      }
      if (url.hostname === "youtu.be") {
        const path = url.pathname.substring(1);
        if (path) return path;
      }
    } catch (e) {
      // Ignore URL parsing errors
    }

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = trimmed.match(regExp);
    if (match && match[2].length === 11) {
      return match[2];
    }

    return "";
  };

  // Helper to validate and convert timestamp to HH:MM:SS format
  const formatTimestamp = (timeStr: string): string => {
    const cleaned = timeStr.trim();
    const match = cleaned.match(/^(?:(\d?\d):)?(\d?\d):(\d\d)$/);
    if (!match) return "";

    const hours = match[1] ? parseInt(match[1], 10) : 0;
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);

    if (minutes >= 60 || seconds >= 60) return "";

    const pad = (num: number) => String(num).padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault();

    const id = parseVideoId(videoUrl);
    if (!id) {
      toast.error("Invalid YouTube Video URL or Video ID");
      return;
    }

    const formattedTs = formatTimestamp(timestamp);
    if (!formattedTs) {
      toast.error("Invalid timestamp format. Use MM:SS or HH:MM:SS");
      return;
    }

    try {
      setLoading(true);
      const existingVideo = videos.find((v) => v.id === id);
      const title = existingVideo ? existingVideo.title : `YouTube Video (${id})`;

      await addTimestampSync(
        {
          timestamp: formattedTs,
          description: description.trim(),
        },
        id,
        title
      );

      toast.success("Bookmark added successfully!");
      setVideoUrl("");
      setTimestamp("");
      setDescription("");
      setShowAddForm(false);
      await loadVideos();
    } catch (err: any) {
      toast.error("Failed to add bookmark: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Video Bookmark
  const handleDeleteVideo = async (videoId: string, title: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete all bookmarks for "${title}"?`);
    if (!confirmDelete) return;

    try {
      setLoading(true);
      await deleteVideoSync(videoId);
      toast.success("Video and its bookmarks deleted!");
      await loadVideos();
    } catch (err: any) {
      toast.error("Failed to delete video: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Individual Timestamp
  const handleDeleteTimestamp = async (videoId: string, timestampStr: string) => {
    const confirmDelete = window.confirm(`Delete bookmark at ${timestampStr}?`);
    if (!confirmDelete) return;

    try {
      setLoading(true);
      await deleteTimestampSync(timestampStr, videoId);
      toast.success("Bookmark deleted!");
      await loadVideos();
    } catch (err: any) {
      toast.error("Failed to delete bookmark: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (videoId: string, ts: Timestamp) => {
    setEditingTimestamp({ videoId, timestamp: ts });
    setEditDescription(ts.description);
  };

  // Save Edit Description
  const handleSaveEdit = async () => {
    if (!editingTimestamp) return;

    try {
      setLoading(true);
      await editDescriptionSync(editingTimestamp.videoId, {
        timestamp: editingTimestamp.timestamp.timestamp,
        description: editDescription.trim(),
      });
      toast.success("Description updated successfully!");
      setEditingTimestamp(null);
      await loadVideos();
    } catch (err: any) {
      toast.error("Failed to update description: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open YouTube Video at timestamp in a new tab
  const handlePlayTimestamp = (videoId: string, timestampStr: string) => {
    // Convert HH:MM:SS format to total seconds
    const parts = timestampStr.split(":");
    let seconds = 0;
    if (parts.length === 3) {
      seconds = (+parts[0]) * 3600 + (+parts[1]) * 60 + (+parts[2]);
    } else if (parts.length === 2) {
      seconds = (+parts[0]) * 60 + (+parts[1]);
    } else {
      seconds = +parts[0];
    }

    const url = `https://www.youtube.com/watch?v=${videoId}&t=${seconds}s`;
    window.open(url, "_blank");
  };

  return (
    <div className="sidepanel-container">
      <div className="header">
        <h2>YouTube Bookmarks</h2>
      </div>

      <button className="add-bookmark-toggle" onClick={() => setShowAddForm(!showAddForm)}>
        <FaPlus style={{ marginRight: "0.5rem" }} /> {showAddForm ? "Close Add Form" : "Add Manual Bookmark"}
      </button>

      {showAddForm && (
        <form className="add-bookmark-form" onSubmit={handleAddBookmark}>
          <h3>Add Manual Bookmark</h3>
          <div className="form-group">
            <label htmlFor="videoUrl">YouTube URL or Video ID</label>
            <input
              id="videoUrl"
              type="text"
              placeholder="e.g., dQw4w9WgXcQ or youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="timestamp">Timestamp (MM:SS or HH:MM:SS)</label>
            <input
              id="timestamp"
              type="text"
              placeholder="e.g., 01:23 or 1:05:40"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              placeholder="Bookmark description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-submit">
              Save
            </button>
            <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{ position: "relative" }}>
        <input
          type="text"
          className="search-bar"
          placeholder="Search videos by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading && videos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "1rem" }}>Loading...</div>
      ) : filteredVideos.length === 0 ? (
        <div className="empty-state">
          <p>No bookmarks found.</p>
          <a href="https://www.youtube.com" target="_blank" rel="noreferrer">
            Go to YouTube
          </a>
        </div>
      ) : (
        <ul className="video-list">
          {filteredVideos.map((video) => (
            <li
              key={video.id}
              className={`video-card ${expandedVideos[video.id] ? "expanded" : ""}`}
            >
              <div className="video-card-header" onClick={() => toggleVideoExpand(video.id)}>
                <span className="video-title">{video.title}</span>
                <div className="video-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="delete-video-btn"
                    title="Delete video bookmarks"
                    onClick={() => handleDeleteVideo(video.id, video.title)}
                  >
                    <FaTrash />
                  </button>
                  <FaChevronDown
                    className={`collapse-icon ${expandedVideos[video.id] ? "rotated" : ""}`}
                  />
                </div>
              </div>
              {expandedVideos[video.id] && (
                <div className="timestamps-list">
                  {video.timestamps.map((ts) => (
                    <div key={ts.timestamp} className="timestamp-item">
                      <div className="timestamp-content">
                        <button
                          className="timestamp-link"
                          title={`Play at ${ts.timestamp}`}
                          onClick={() => handlePlayTimestamp(video.id, ts.timestamp)}
                        >
                          {ts.timestamp} <FaExternalLinkAlt style={{ fontSize: "8px", marginLeft: "2px" }} />
                        </button>
                        <span className="timestamp-desc">
                          {ts.description || <span className="new-timestamp-span">new timestamp</span>}
                        </span>
                      </div>
                      <div className="timestamp-actions">
                        <button
                          className="edit-ts-btn"
                          title="Edit description"
                          onClick={() => openEditModal(video.id, ts)}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="delete-ts-btn"
                          title="Delete timestamp"
                          onClick={() => handleDeleteTimestamp(video.id, ts.timestamp)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {editingTimestamp && (
        <>
          <div className="edit-modal-overlay" onClick={() => setEditingTimestamp(null)}></div>
          <div className="edit-modal">
            <h4>Edit Bookmark Description</h4>
            <p>At {editingTimestamp.timestamp.timestamp}</p>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Edit description..."
            />
            <div className="modal-actions">
              <button className="btn-save" onClick={handleSaveEdit}>
                Save
              </button>
              <button className="btn-cancel" onClick={() => setEditingTimestamp(null)}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      <ToastContainer />
    </div>
  );
};

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
root.render(<SidePanel />);
