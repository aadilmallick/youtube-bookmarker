import {
  MessageTypes,
  SendingMessage,
  addMessageListener,
  sendMessageToContentScript,
} from "../utils/messages";
import { defaultSyncOptions, storeSync } from "../utils/storage";

// TODO: background script
chrome.runtime.onInstalled.addListener(async () => {
  // TODO: on installed function
  await storeSync(defaultSyncOptions);
});

// addMessageListener(
//   MessageTypes.ASK_VIDEO_ID,
//   (message, sender, sendResponse) => {
//     console.log("message", message);
//     getTheVideoId()
//       .then((videoId) => {
//         console.log("videoId", videoId);
//         sendResponse({ videoId });
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   }
// );

chrome.runtime.onMessage.addListener(
  (message: SendingMessage, sender, sendResponse) => {
    if (message.type === "ASK_VIDEO_ID") {
      // when using asynchronously, return true to indicate that you wish to send a response asynchronously
      getTheVideoId()
        .then((videoId) => {
          console.log("videoId", videoId);
          sendResponse(videoId);
          return true;
        })
        .catch((err) => {
          console.log(err);
        });
    }
    return true;
  }
);

async function getTheVideoId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  // tab.url will only be populated if command is triggered form one of the allowed host permission urls
  const currentTab = tabs[0];

  // if not on host permission site, exit.
  if (!currentTab?.url) {
    return;
  }

  console.log(currentTab);
  const queryParams = currentTab.url.split("?")[1];
  if (!queryParams) return;
  const urlParams = new URLSearchParams(queryParams);
  const videoId = urlParams.get("v");
  return videoId;
}

async function getVideoId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  // tab.url will only be populated if command is triggered form one of the allowed host permission urls
  const currentTab = tabs[0];

  // if not on host permission site, exit.
  if (!currentTab?.url) {
    return;
  }

  console.log(currentTab);
  const queryParams = currentTab.url.split("?")[1];
  if (!queryParams) return;
  const urlParams = new URLSearchParams(queryParams);
  const videoId = urlParams.get("v");

  await sendMessageToContentScript(
    MessageTypes.SAVE_VIDEO,
    {
      videoId: urlParams.get("v"),
    },
    (response) => {
      console.log("response", response);
    }
  );
}

chrome.commands.onCommand.addListener(async (command) => {
  console.log(`Command: ${command}`);
  if (command === "save_bookmark") {
  }
});
