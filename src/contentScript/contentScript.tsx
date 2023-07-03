// TODO: content script

import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./contentScript.css";
import {
  MessageTypes,
  Response,
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
      const response: Response = await sendMessageFromContentScript(
        MessageTypes.ASK_VIDEO_ID
      );
      console.group(`${MessageTypes.ASK_VIDEO_ID} [contentscript] response`);
      console.log(response);
      console.groupEnd();

      setVideoId(response.videoId);
    }

    sendMessage();
  }, []);

  useEffect(() => {
    const callback = addMessageListener(
      MessageTypes.ADD_BOOKMARK,
      async (message, sender, sendResponse) => {
        console.group(`${MessageTypes.ADD_BOOKMARK} [contentscript] message`);
        console.log(message);
        console.groupEnd();
        const vidId = message.payload.videoId;
        // if (vidId) setVideoId(vidId);
        console.log("vidId", vidId);
        // setVideoId(vidId);
        await addBookmark(vidId);
        sendResponse({ success: true });
      }
    );

    return () => {
      chrome.runtime.onMessage.removeListener(callback);
    };
  }, []);

  // TODO: add listener for keyboard shortcut

  useEffect(() => {
    async function getStorage() {
      const videos = await getSyncBookmarks();
      console.table(videos);
    }

    getStorage();
  }, [videoId]);
  const addBookmark = async (videoId: string) => {
    const videoTitle = document.querySelector(
      "#below #title h1 yt-formatted-string"
    ).textContent;
    console.log("time", convertSecondsToTimestamp(ytPlayer.currentTime));
    console.log("videoId in addBookmark", videoId);
    await addTimestampSync(
      {
        description: "new bookmark",
        timestamp: convertSecondsToTimestamp(ytPlayer.currentTime),
      },
      videoId,
      videoTitle
    );
  };
  return (
    <button className="ytp-button up-btn" onClick={() => addBookmark(videoId)}>
      <span>B+</span>
    </button>
  );
};

const container = document.createElement("div");
container.classList.add("my-inline-block-div");
container.id = "my-extension-root";
const root = createRoot(container);
const controls = document.querySelector(".ytp-right-controls");

if (!controls.querySelector("#my-extension-root")) {
  controls.prepend(container);
  root.render(<BookmarkButton />);
}
