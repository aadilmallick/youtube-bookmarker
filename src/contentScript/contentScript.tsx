// TODO: content script

import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./contentScript.css";
import {
  MessageTypes,
  Response,
  addMessageListenerAsync,
  removeMessageListenerAsync,
  sendMessageFromContentScript,
} from "../utils/messages";
import { convertSecondsToTimestamp } from "./lib";
import {
  Video,
  addTimestampSync,
  getSync,
  getSyncBookmarks,
} from "../utils/storage";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ytPlayer = document.querySelector(".video-stream") as HTMLVideoElement;

// TODO: As soon as we're on the youtube watch page, ask background script to send us the video id
// TODO: then set the video id in state, and when button is clicked save the timestamp in storgae
// TODO: connect keyboard shortcut to this method
const BookmarkButton = () => {
  const [videoId, setVideoId] = React.useState<string>("");

  // ask for video id at start
  useEffect(() => {
    async function sendMessage() {
      const response: Response = await sendMessageFromContentScript(
        MessageTypes.ASK_VIDEO_ID
      );

      setVideoId(response.videoId);
    }

    sendMessage();
  }, []);

  // keyboard shortcut listener
  useEffect(() => {
    const callback = addMessageListenerAsync(
      MessageTypes.ADD_BOOKMARK,
      async (message, sender, sendResponse) => {
        const vidId = message.payload.videoId;
        await addBookmark(vidId);
        sendResponse({ success: true });
      }
    );

    return () => {
      chrome.runtime.onMessage.removeListener(callback);
    };
  }, []);

  useEffect(() => {
    const callback = addMessageListenerAsync(
      MessageTypes.SEEK_TO_TIME,
      async (message, sender, sendResponse) => {
        const time = message.payload.time;
        ytPlayer.currentTime = time;
        ytPlayer.play();
        sendResponse({ success: true });
      }
    );

    return () => {
      chrome.runtime.onMessage.removeListener(callback);
    };
  }, []);
  // logger
  useEffect(() => {
    async function getStorage() {
      const videos = await getSyncBookmarks();
    }

    getStorage();
  }, [videoId]);
  const addBookmark = async (videoId: string) => {
    const videoTitle = document.querySelector(
      "#below #title h1 yt-formatted-string"
    ).textContent;
    await addTimestampSync(
      {
        description: "hi",
        timestamp: convertSecondsToTimestamp(ytPlayer.currentTime),
      },
      videoId,
      videoTitle
    );
    toast("bookmark added", {
      position: "top-right",
      autoClose: 2000,
    });
  };

  return (
    <>
      {/* <ToastContainer /> */}
      <button
        className="ytp-button up-btn"
        onClick={() => addBookmark(videoId)}
      >
        <span>B+</span>
      </button>
    </>
  );
};

// this is how you position the toast: use inline styles
const Modal = () => {
  return <ToastContainer style={{ top: "8rem" }} />;
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

const modalContainer = document.createElement("div");
modalContainer.classList.add("my-modal-container");
modalContainer.id = "my-modal-container";
modalContainer.style.fontSize = "16px";

const videoContainer = document.querySelector(".html5-video-container");
const root2 = createRoot(modalContainer);
if (!videoContainer?.querySelector("#my-modal-container")) {
  videoContainer?.prepend(modalContainer);
  root2.render(<Modal />);
}
