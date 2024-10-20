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
import { convertSecondsToTimestamp, convertTimestampToSeconds } from "./lib";
import {
  Video,
  addTimestampSync,
  getSync,
  getSyncBookmarks,
  getVideoSync,
} from "../utils/storage";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ! Huge discovery: chrome.commands overrides the keyboard shortcuts for all urls, no matter what.
// ! : to only allow a keyboard shrotcut on a specific site, listen for it from your content script.

// youtube video player
const ytPlayer = document.querySelector(".video-stream") as HTMLVideoElement;

//  As soon as we're on the youtube watch page, ask background script to send us the video id
// then set the video id in state, and when button is clicked save the timestamp in storgae
//  connect keyboard shortcut to this method
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

  // * the fucking reason because this didn't work was because I forgot about the dependencies!!!

  useEffect(() => {
    if (videoId === "") {
      return;
    }
    async function listener(event) {
      if (event.ctrlKey && String.fromCharCode(event.keyCode) === "B") {
        event.preventDefault();
        event.stopPropagation();
        await addBookmark(videoId);
      }
    }
    document.addEventListener("keydown", listener, true);
    return () => {
      document.removeEventListener("keydown", listener);
    };
  }, [videoId]);

  useEffect(() => {
    // listen for seek to current time message, and seek to selected timestamp
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

  const addBookmark = async (videoId: string) => {
    const videoTitle = document.querySelector(
      "#below #title h1 yt-formatted-string"
    ).textContent;

    if (videoId === "") {
      toast("something went wrong. Maybe refresh the page", {
        position: "top-right",
        autoClose: 2000,
        type: "error",
      });
      return;
    }

    let videoIdUrl = new URL(window.location.href).searchParams.get("v");

    // maybe check if we have the correct video id, queu bug

    await addTimestampSync(
      {
        description: "",
        // simple utility function. This works. Ignore it
        timestamp: convertSecondsToTimestamp(ytPlayer.currentTime),
      },
      videoIdUrl,
      videoTitle
    );
    toast("bookmark added", {
      position: "top-right",
      autoClose: 2000,
    });
  };

  return (
    <>
      {/* add custom button to youtube player */}
      <button
        className="ytp-button up-btn"
        onClick={() => addBookmark(videoId)}
      >
        <span>B+</span>
      </button>
    </>
  );
};

const Modal = () => {
  return <ToastContainer style={{ top: "8rem" }} />;
};

// react container setup
const container = document.createElement("div");
container.classList.add("my-inline-block-div");
container.id = "my-extension-root";
const root = createRoot(container);

// youtube player buttons
const controls = document.querySelector(".ytp-right-controls");

if (!controls.querySelector("#my-extension-root")) {
  controls.prepend(container);
  root.render(<BookmarkButton />);
}

// react modal container setup
const modalContainer = document.createElement("div");
modalContainer.classList.add("my-modal-container");
modalContainer.id = "my-modal-container";
modalContainer.style.fontSize = "16px";

const videoContainer = document.querySelector(".html5-video-container");
const root2 = createRoot(modalContainer);

const timeline = document.querySelector(".ytp-progress-bar-container");
// if (progressBar) {
//   alert("progress bar found");
// }

async function loadTimestamps() {
  if (document.readyState !== "complete") return;
  const progressBar = timeline.querySelector(
    ".ytp-progress-bar[role='slider']"
  );
  if (!progressBar) return;

  const videoDurationInSeconds = ytPlayer.duration;

  const videoId = new URL(window.location.href).searchParams.get("v");
  const video = await getVideoSync(videoId);

  const bookmarks: {
    timestamp: string;
    description: string;
    element: HTMLDivElement;
  }[] = [];

  // makes bookmarks appear on video
  // * store bookmark text on bookmark.title
  // * store timestamp on bookmark.data-timestamp
  video.timestamps.forEach((timestamp) => {
    const bookmark = document.createElement("div");
    bookmark.classList.add("bookmark-timestamp");
    bookmark.style.left = `${
      (convertTimestampToSeconds(timestamp.timestamp) /
        videoDurationInSeconds) *
      100
    }%`;
    // add description to bookmark
    bookmark.title = timestamp.description;
    // add timestamp to bookmark
    bookmark.setAttribute("data-timestamp", timestamp.timestamp);
    progressBar.appendChild(bookmark);

    bookmarks.push({
      timestamp: timestamp.timestamp,
      description: timestamp.description,
      element: bookmark,
    });
  });

  // load invisible bookmark description block
  const bookmarkDescription = document.createElement("div");
  bookmarkDescription.classList.add("bookmark-description");
  videoContainer.appendChild(bookmarkDescription);

  progressBar.addEventListener("mouseleave", () => {
    bookmarkDescription.classList.remove("show");
  });

  // const bookmarks = [...progressBar.querySelectorAll(".bookmark-timestamp")] as HTMLDivElement[];
  progressBar.addEventListener("mousemove", (event) => {
    const bookmarkTarget = event.target as HTMLDivElement;

    // if hovering over a bookmark, show description
    if (bookmarkTarget.getAttribute("data-timestamp")) {
      bookmarkDescription.classList.add("show");
      bookmarkDescription.textContent =
        bookmarkTarget.getAttribute("data-timestamp") +
        " " +
        bookmarkTarget.title;
    }
  });
  // bookmarks.forEach((bookmark) => {
  //   bookmark.element.addEventListener("mouseover", async () => {
  //     bookmarkDescription.classList.add("show");
  //   });
  // })
}

loadTimestamps();

if (!videoContainer?.querySelector("#my-modal-container")) {
  videoContainer?.prepend(modalContainer);
  root2.render(<Modal />);
}
