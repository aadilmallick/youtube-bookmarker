import React, { useEffect } from "react";
import {
  Video,
  deleteVideoSync,
  getSyncBookmarks,
  getVideoSync,
} from "../utils/storage";
import { getTheVideoId } from "../background/background";
import { FaCopy, FaExternalLinkAlt } from "react-icons/fa";
import { toast } from "react-toastify";

export const SavedVideos = () => {
  const [videos, setVideos] = React.useState<Video[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  useEffect(() => {
    async function getStorage() {
      setLoading(true);
      const videos = await getSyncBookmarks();
      setVideos(videos);
      setLoading(false);
    }

    getStorage();
  }, []);

  const onDelete = async (videoId: string) => {
    await deleteVideoSync(videoId);
    setVideos((prev) => prev.filter((video) => video.id !== videoId));
  };

  if (videos.length === 0) return <p>No videos saved</p>;

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="utilities">
        <div
          className="json-icon"
          onClick={() => {
            setLoading(true);
            navigator.clipboard.writeText(JSON.stringify(videos, null, 2));
            toast("Copied to clipboard", {
              autoClose: 1000,
            });
            setLoading(false);
          }}
        >
          <FaCopy color="gray" />
          <p>Export JSON</p>
        </div>
        <div className="table-link-container">
          <a href="https://ytbookmarkertable.netlify.app/" target="_blank">
            Bookmarks Table
          </a>
          <FaExternalLinkAlt color="gray" />
        </div>
        <div
          className="sync-btn"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          <p>Sync to GitHub</p>
        </div>
        <div
          className="sync-btn"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          <p>Import JSON</p>
        </div>
      </div>
      <ul
        style={{
          overflowY: "auto",
          flex: 1,
          paddingBottom: "1rem",
          maxHeight: "300px",
        }}
      >
        {videos.map((video) => (
          <VideoRow video={video} key={video.id} onDelete={onDelete} />
        ))}
      </ul>
    </div>
  );
};

const VideoRow = ({
  video,
  onDelete,
}: {
  video: Video;
  onDelete: (videoId: string) => void;
}) => {
  return (
    <li className="video-row">
      <p>
        <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank">
          {video.title}
        </a>
      </p>
      <button className="delete-btn" onClick={() => onDelete(video.id)}>
        X
      </button>
    </li>
  );
};
