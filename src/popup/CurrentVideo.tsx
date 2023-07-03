import React, { useEffect } from "react";
import { Video, getVideoSync } from "../utils/storage";
import { getTheVideoId } from "../background/background";
import { convertTimestampToSeconds } from "../contentScript/lib";

// TODO: get current video, save to state
export const CurrentVideo = () => {
  const [video, setVideo] = React.useState<Video | null>(null);
  const [notOnYoutube, setNotOnYoutube] = React.useState<boolean>(true);
  useEffect(() => {
    async function checkTab() {
      const videoId = await getTheVideoId();
      if (!videoId) {
        return;
      }
      setNotOnYoutube(false);

      const video = await getVideoSync(videoId);

      if (!video) {
        return;
      }
      video.timestamps.sort((a, b) => {
        return (
          convertTimestampToSeconds(a.timestamp) -
          convertTimestampToSeconds(b.timestamp)
        );
      });
      setVideo(video);
    }

    checkTab();
  }, []);

  if (notOnYoutube) {
    return <p>Sorry, you have to be on youtube</p>;
  }
  if (!video) {
    return <p>Sorry, no timestamps</p>;
  }
  return (
    <div className="current-video-container">
      <h4>{video.title}</h4>
      {video.timestamps.map((timestamp) => (
        <TimestampRow
          key={timestamp.timestamp}
          timestamp={timestamp.timestamp}
          description={timestamp.description}
        ></TimestampRow>
      ))}
    </div>
  );
};

const TimestampRow = ({
  timestamp,
  description,
}: {
  timestamp: string;
  description: string;
}) => {
  return (
    <div className="timestamp-row">
      {/* TODO: add timestamp link, using &t=141s attribute, passing in num seconds */}
      <a href="#">{timestamp}</a>
      <p>{description}</p>
    </div>
  );
};
