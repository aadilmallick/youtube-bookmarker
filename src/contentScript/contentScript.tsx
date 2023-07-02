// TODO: content script

import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./contentScript.css";
import {
  MessageTypes,
  addMessageListener,
  removeMessageListener,
  sendMessageFromContentScript,
} from "../utils/messages";
import { convertSecondsToTimestamp } from "./lib";
import {
  Video,
  addTimestampSync,
  getSync,
  getSyncBookmarks,
} from "../utils/storage";

const ytPlayer = document.querySelector(".video-stream") as HTMLVideoElement;

// TODO: As soon as we're on the youtube watch page, ask background script to send us the video id
// TODO: then set the video id in state, and when button is clicked save the timestamp in storgae
// TODO: connect keyboard shortcut to this method
const BookmarkButton = () => {
  const [videoId, setVideoId] = React.useState<string>("");
  useEffect(() => {
    async function sendMessage() {
      // await sendMessageFromContentScript(
      //   MessageTypes.ASK_VIDEO_ID,
      //   {},
      //   (response: { videoId: string }) => {
      //     console.log("response in content script", response);
      //   }
      // );
      const response = await chrome.runtime.sendMessage({
        type: MessageTypes.ASK_VIDEO_ID,
      });
      console.log("response in content script", response);
    }

    sendMessage();
    // const callback = addMessageListener(
    //   MessageTypes.SAVE_VIDEO,
    //   (message, sender, sendResponse) => {
    //     console.log("get url");
    //     if (!message.payload) throw new Error("no payload");
    //     setVideoId(message.payload.videoId);
    //     sendResponse({ message: "get url" });
    //   }
    // );

    // return () => removeMessageListener(callback);
  }, []);

  // useEffect(() => {
  //   console.log("video id", videoId);
  //   async function getStorage() {
  //     const videos = await getSyncBookmarks();
  //     console.log("videos", videos);
  //   }

  //   getStorage();
  // }, [videoId]);
  const addBookmark = async () => {
    // TODO: 1. save video, if not saved already
    // TODO 2. save timestamp
    // TODO 3. connect keyboard shortcut to this method
    const videoTitle = document.querySelector(
      "#below #title h1 yt-formatted-string"
    ).textContent;

    await addTimestampSync(
      {
        description: "test",
        timestamp: convertSecondsToTimestamp(ytPlayer.currentTime),
      },
      videoId,
      videoTitle
    );
  };
  return (
    <button className="ytp-button up-btn" onClick={addBookmark}>
      <span>B+</span>
    </button>
  );
};

const container = document.createElement("div");
container.classList.add("my-inline-block-div");
const root = createRoot(container);
document.querySelector(".ytp-right-controls").prepend(container);

root.render(<BookmarkButton />);
