import React, { useEffect } from "react";
import {
  Timestamp,
  Video,
  deleteTimestampSync,
  editDescriptionSync,
  getVideoSync,
} from "../utils/storage";
import { getTheVideoId } from "../background/background";
import { convertTimestampToSeconds } from "../contentScript/lib";
import { MessageTypes, sendMessageToContentScript } from "../utils/messages";

// TODO: get current video, save to state
export const CurrentVideo = () => {
  const [video, setVideo] = React.useState<Video | null>(null);
  const [notOnYoutube, setNotOnYoutube] = React.useState<boolean>(true);

  const onDelete = async (timestamp: string, videoId: string) => {
    await deleteTimestampSync(timestamp, videoId);
    setVideo((prevVideo) => ({
      ...prevVideo,
      timestamps:
        prevVideo?.timestamps?.filter((ts) => ts.timestamp !== timestamp) || [],
    }));
  };

  const onEditDescription = async (
    description: string,
    timestamp: string,
    videoId: string
  ) => {
    await editDescriptionSync(videoId, { timestamp, description });
    setVideo((prevVideo) => {
      const newTimestamps = prevVideo?.timestamps.map((ts) => {
        if (ts.timestamp === timestamp) {
          return { ...ts, description };
        }
        return ts;
      });
      return { ...prevVideo, timestamps: newTimestamps };
    });
  };

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
    return (
      <p>Sorry, you have to be on a youtube video for bookmarks to load</p>
    );
  }

  if (!video || video.timestamps.length === 0) {
    return <p>Sorry, no timestamps</p>;
  }

  return (
    <div className="current-video-container">
      <h4>{video.title}</h4>
      {video.timestamps.map((timestamp) => (
        <TimestampRow
          key={timestamp.timestamp}
          timestamp={timestamp}
          description={timestamp.description}
          videoId={video.id}
          onDelete={onDelete}
          onEditDescription={onEditDescription}
        ></TimestampRow>
      ))}
    </div>
  );
};

interface TimestampRowProps {
  timestamp: Timestamp;
  description: string;
  onDelete: (timestamp: string, videoId: string) => Promise<void>;
  videoId: string;
  onEditDescription: (
    description: string,
    timestamp: string,
    videoId: string
  ) => Promise<void>;
}

const TimestampRow = ({
  timestamp,
  description,
  onDelete,
  videoId,
  onEditDescription,
}: TimestampRowProps) => {
  const onSeek = async () => {
    const seconds = convertTimestampToSeconds(timestamp.timestamp);
    const response = await sendMessageToContentScript(
      MessageTypes.SEEK_TO_TIME,
      { time: seconds }
    );
  };

  const [showEditModal, setShowEditModal] = React.useState<boolean>(false);
  return (
    <div
      className="timestamp-row"
      onClick={(e) => {
        // e.stopPropagation();
        setShowEditModal(true);
      }}
    >
      <div className="timestamp-container">
        <p className="short-description">
          {" "}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSeek();
            }}
            className="timestamp-btn"
            title={`seek to timestamp ${timestamp.timestamp}`}
            style={{
              cursor: "pointer",
            }}
          >
            {timestamp.timestamp}
          </button>
          {description ? (
            description.slice(0, 500) + (description.length > 500 ? "..." : "")
          ) : (
            <span
              style={{
                color: "gray",
              }}
            >
              new timestamp
            </span>
          )}
        </p>
        <button
          onClick={(e) => {
            // need e.stopPropagation() so that the click doesn't go to the parent
            e.stopPropagation();
            onDelete(timestamp.timestamp, videoId);
          }}
          className="delete-timestamp"
          title="Delete timestamp"
        >
          X
        </button>
      </div>
      <EditModal
        show={showEditModal}
        timestamp={timestamp}
        hideModal={() => setShowEditModal(false)}
        onEditDescription={onEditDescription}
        videoId={videoId}
      ></EditModal>
    </div>
  );
};

interface EditModalProps {
  timestamp: Timestamp;
  show: boolean;
  hideModal: () => void;
  onEditDescription: (
    description: string,
    timestamp: string,
    videoId: string
  ) => Promise<void>;
  videoId: string;
}
const EditModal = ({
  timestamp,
  show,
  hideModal,
  onEditDescription,
  videoId,
}: EditModalProps) => {
  const [description, setDescription] = React.useState<string>(
    timestamp.description
  );

  if (!show) {
    return null;
  }
  return (
    <>
      <div
        className="edit-modal-overlay"
        onClick={(e) => {
          // figure out what the fuck this does
          e.stopPropagation();
          hideModal();
        }}
      ></div>
      <div className="edit-modal">
        <h4>Edit Timestamp</h4>
        <p>{timestamp.timestamp} </p>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
          }}
        >
          {timestamp.description}
        </textarea>
        <button
          onClick={async () => {
            await onEditDescription(description, timestamp.timestamp, videoId);
            hideModal();
          }}
        >
          Save
        </button>
      </div>
    </>
  );
};

/* TODO: 
Edit functionality: click on a timestamp, and it will open a modal with the 
timestamp and description textarea. We will clip off the timestamp description by only allowing 
3 words 

Delete functionality: Click on the trash can icon, and brings up a modal to confirm deletion. 
When confirmed, delete timestamp and reflect in state. 
*/
