import {
  MessageTypes,
  SendingMessage,
  addMessageListenerAsync,
  sendMessageToContentScript,
} from "../utils/messages";

chrome.runtime.onInstalled.addListener(async () => {
  // TODO: do not reset storage when installed. only set default when empty
});

chrome.storage.sync.getBytesInUse(null, function (bytesUsed) {
  // Calculate the usage in kilobytes
  var kilobytesUsed = bytesUsed / 1024;

  // Log the usage
  // console.log("Sync storage usage: " + kilobytesUsed + " KB");
});

// callback function is async, and you can choose whether to send response.
// if you don't send response, the callback function in the receiving side won't execute.
addMessageListenerAsync(
  MessageTypes.ASK_VIDEO_ID,
  async (message, sender, sendResponse) => {
    const videoId = await getTheVideoId();
    sendResponse({ videoId });
  }
);

export async function getTheVideoId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];

  // tab.url will only be populated if command is triggered form one of the allowed host permission urls
  // if not on host permission site, exit.
  // I have set host permissions to only youtube, so this code will exit on every site except youtube
  if (!currentTab?.url) {
    return;
  }

  const queryParams = currentTab.url.split("?")[1];
  if (!queryParams) return;
  const urlParams = new URLSearchParams(queryParams);
  const videoId = urlParams.get("v");
  return videoId;
}

// TODO: automatically inject content script

chrome.tabs.onActivated.addListener(async (tab) => {
  const videoId = await getTheVideoId();
  if (!videoId) return;

  await chrome.scripting.executeScript({
    files: ["contentScript.js"],
    target: { tabId: tab.tabId },
  });
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.status !== "complete") return;

  const videoId = await getTheVideoId();
  if (!videoId) return;

  await chrome.scripting.executeScript({
    files: ["contentScript.js"],
    target: { tabId: tabId },
  });
});
