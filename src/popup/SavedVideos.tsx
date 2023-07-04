import React, { useEffect } from "react";
import {
  Video,
  deleteVideoSync,
  getSyncBookmarks,
  getVideoSync,
} from "../utils/storage";
import { getTheVideoId } from "../background/background";
import { FaCopy } from "react-icons/fa";
import { toast } from "react-toastify";

export const SavedVideos = () => {
  const [videos, setVideos] = React.useState<Video[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  useEffect(() => {
    async function getStorage() {
      setLoading(true);
      const videos = await getSyncBookmarks();
      console.table(videos);
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
    <div>
      <div
        className="json-icon"
        onClick={() => {
          setLoading(true);
          navigator.clipboard.writeText(JSON.stringify(videos));
          toast("Copied to clipboard", {
            autoClose: 1000,
          });
          setLoading(false);
        }}
      >
        <FaCopy color="gray" />
        <p>Export JSON</p>
      </div>
      {videos.map((video) => (
        <VideoRow video={video} key={video.id} onDelete={onDelete} />
      ))}
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
    <div className="video-row">
      <p>
        <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank">
          {video.title}
        </a>
      </p>
      <button className="delete-btn" onClick={() => onDelete(video.id)}>
        X
      </button>
    </div>
  );
};
