import {
  MessageTypes,
  SendingMessage,
  addMessageListener,
  sendMessageToContentScript,
} from "../utils/messages";
import {
  SyncStorageKeys,
  defaultSyncOptions,
  getSync,
  storeSync,
} from "../utils/storage";

// whenever refresh, this will run, and these things will happen:
// Fired when the extension is first installed, when the extension is updated
// to a new version, and when Chrome is updated to a new version.
// 1. reset storage to default values
// 2. reset badge text to empty string
chrome.runtime.onInstalled.addListener(async () => {
  // TODO: do not reset storage when installed. only set default when empty
  // const stored = await getSync(
  //   Object.keys(defaultSyncOptions) as SyncStorageKeys
  // );
  // if (!stored) {
  await storeSync(defaultSyncOptions);
  // }
});

// callback function is async, and you can choose whether to send response.
// if you don't send response, the callback function in the receiving side won't execute.
addMessageListener(
  MessageTypes.ASK_VIDEO_ID,
  async (message, sender, sendResponse) => {
    // console.log("message", message);
    const videoId = await getTheVideoId();
    sendResponse({ videoId });
  }
);

export async function getTheVideoId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  // tab.url will only be populated if command is triggered form one of the allowed host permission urls
  const currentTab = tabs[0];

  // if not on host permission site, exit.
  if (!currentTab?.url) {
    return;
  }

  // console.log(currentTab);
  const queryParams = currentTab.url.split("?")[1];
  if (!queryParams) return;
  const urlParams = new URLSearchParams(queryParams);
  const videoId = urlParams.get("v");
  return videoId;
}

chrome.commands.onCommand.addListener(async (command) => {
  console.log(`Command: ${command}`);
  if (command === "save_bookmark") {
    const videoId = await getTheVideoId();
    if (!videoId) return;
    const response = await sendMessageToContentScript(
      MessageTypes.ADD_BOOKMARK,
      { videoId }
    );
    console.group(`${MessageTypes.ADD_BOOKMARK} [background] response`);
    console.log(response);
    console.groupEnd();
  }
});

// TODO: automatically inject content script

chrome.tabs.onActivated.addListener(async (tab) => {
  console.log(tab);
  const videoId = await getTheVideoId();
  if (!videoId) return;

  await chrome.scripting.executeScript({
    files: ["contentScript.js"],
    target: { tabId: tab.tabId },
  });
  console.log("script injectied");
});
