import React, { useEffect } from "react";
import {
  Video,
  deleteVideoSync,
  getSyncBookmarks,
  getVideoSync,
} from "../utils/storage";
import { getTheVideoId } from "../background/background";

// TODO: add delete functionality
// TODO: add go to current video functionality
// TODO: add link functionality
export const SavedVideos = () => {
  const [videos, setVideos] = React.useState<Video[]>([]);

  useEffect(() => {
    async function getStorage() {
      const videos = await getSyncBookmarks();
      console.table(videos);
      setVideos(videos);
    }

    getStorage();
  }, []);

  const onDelete = async (videoId: string) => {
    await deleteVideoSync(videoId);
    setVideos((prev) => prev.filter((video) => video.id !== videoId));
  };

  if (videos.length === 0) return <p>No videos saved</p>;

  return (
    <div>
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
