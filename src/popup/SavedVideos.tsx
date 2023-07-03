import React, { useEffect } from "react";
import { Video, getSyncBookmarks, getVideoSync } from "../utils/storage";
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
  return (
    <div>
      {videos.map((video) => (
        <VideoRow video={video} key={video.id} />
      ))}
    </div>
  );
};

const VideoRow = ({ video }: { video: Video }) => {
  return (
    <div className="video-row">
      <p>
        <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank">
          {video.title}
        </a>
      </p>
    </div>
  );
};
