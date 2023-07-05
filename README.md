# My bookmarks

My bookmarks are saved [here](https://codebeautify.org/jsonviewer/y23907db3)

# Current task

1.  List saved videos on popup ✅
2.  List saved videos on popup, add links and title ✅
3.  List current video timestamps on popup, add logic to not show current video on pages other than youtube/watch. ✅
4.  Add timestamp to current video, reflect state ✅
5.  Add seek to current timestamp functionality ✅
6.  Add delete timestamp functionality ✅
7.  Add delete video functionality ✅
8.  Add edit bookmark description funcitonality ✅
9.  Add "bookmark added" feedback toast ✅
10. Add keyboard shortcut and connect it. This will require messaging. ✅
11. Add injecting content script automatically whenever on youtube, listening for tab updates ✅
12. Clone this project, create new one using firebase instead of sync storage
13. Visually show current timestamp on video, like little flags
14. Add page refresh notification, by catching message passing error
15. Try to see how we can do message passing listening more gracefully. Try only synchronous messaging, and see if that fixes it.
16. Make bookmark button more obvious to click on, change hover ✅
17. add export JSON functionality ✅
18. and then create something to create a table of videos from the JSON
19. Have an option for the user to choose sync or local storage, and when they change, copy over everything from one to the other
20. Find a way to reduce the number of times the content script is injected:

    ```javascript
    // Create a Set to store the tab IDs where the content script has been injected
    const injectedTabs = new Set();

    chrome.tabs.onActivated.addListener(async (tab) => {
      const videoId = await getTheVideoId();
      if (!videoId || injectedTabs.has(tab.tabId)) return;

      await chrome.scripting.executeScript({
        files: ["contentScript.js"],
        target: { tabId: tab.tabId },
      });

      // Add the tab ID to the Set to mark it as injected
      injectedTabs.add(tab.tabId);
      console.log("Script injected from onActivated listener");
    });

    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      const videoId = await getTheVideoId();
      if (!videoId || injectedTabs.has(tabId)) return;

      await chrome.scripting.executeScript({
        files: ["contentScript.js"],
        target: { tabId: tabId },
      });

      // Add the tab ID to the Set to mark it as injected
      injectedTabs.add(tabId);
      console.log("Script injected from onUpdated listener");
    });
    ```

# My learning

## Storage

```javascript
interface LocalStorage {}

export interface Timestamp {
  timestamp: string;
  description: string;
}

export interface Video {
  id: string;
  title: string;
  timestamps: Timestamp[];
}

interface SyncStorage {
  options?: {};
  videos?: Video[];
}

export type SyncStorageKeys = (keyof SyncStorage)[];
export type LocalStorageKeys = (keyof LocalStorage)[];

// create default options we return in the getters, if getting back is null
export const defaultSyncOptions: Required<SyncStorage> = {
  options: {},
  videos: [],
};
```

These are the base storage methods. We build every storage method off of these:

```javascript
export function storeSync(obj: SyncStorage): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(obj, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        throw new Error(chrome.runtime.lastError.message);
      }
      resolve();
    });
  });
}

function storeLocal(obj: LocalStorage): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(obj, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        throw new Error(chrome.runtime.lastError.message);
      }
      resolve();
    });
  });
}
```

These are the standard getters:

```javascript
function getLocal(keys: LocalStorageKeys): Promise<LocalStorage> {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result: LocalStorage) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        throw new Error(chrome.runtime.lastError.message);
      }
      resolve(result);
    });
  });
}

export function getSync(keys: SyncStorageKeys): Promise<SyncStorage> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(keys, (result: SyncStorage) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        throw new Error(chrome.runtime.lastError.message);
      }
      resolve(result);
    });
  });
}
```

## Messaging

### Types

```javascript
export enum MessageTypes {
  ADD_BOOKMARK = "ADD_BOOKMARK",
  ASK_VIDEO_ID = "ASK_VIDEO_ID",
  SEEK_TO_TIME = "SEEK_TO_TIME",
}

export type SendingMessage = {
  type: Message;
  payload?: { videoId?: string; videoTitle?: string; time?: number };
};

export type Response = SendingMessage["payload"];

export type Message = keyof typeof MessageTypes;
```

When we send a message, we make the response type the same structure as the payload.

### Sending

```javascript
export const sendMessageToContentScript = async (
  message: Message,
  payload?: SendingMessage["payload"]
): Promise<any> => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return chrome.tabs.sendMessage(tabs[0].id!, {
    type: message,
    payload: payload || {},
  });
};


export const sendMessageFromContentScript = async (
  message: Message,
  payload?: SendingMessage["payload"]
): Promise<any> => {
  return chrome.runtime.sendMessage({ type: message, payload: payload || {} });
};
```

We send messages asynchronously, pass in an optional payload as the second argument. We will be expecting the return type of this function to be the `Response` type, which we can annotate in our code. This is how you use it:

```javascript
async function sendMessage() {
  const response: Response = await sendMessageFromContentScript(
    MessageTypes.ASK_VIDEO_ID
  );
}
```

### Receiving

```javascript
type ReceivingMessageFuncAsync = (
  message?: SendingMessage,
  sender?: chrome.runtime.MessageSender,
  sendResponse?: (response?: any) => void
) => Promise<void>;

type ReceivingMessageFuncSync = (
  message?: SendingMessage,
  sender?: chrome.runtime.MessageSender,
  sendResponse?: (response?: any) => void
) => void;
```

#### Async receiving

When we want to receive messages using async, we need to `return true` after sending a response to indicate we want to use async functionality. Anyway, sending a response is preferred. We can receive messages asynchronously if we structure our code like this:

```javascript
export const addMessageListenerAsync = (
  receivingMessage: Message,
  func: ReceivingMessageFuncAsync
) => {
  const messageCallback = (
    message: SendingMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    if (message.type === receivingMessage) {
      func(message, sender, sendResponse).then(() => true);
      return true;
    }
    return true;
  };
  chrome.runtime.onMessage.addListener(messageCallback);

  return messageCallback;
};
```

```javascript
export const removeMessageListenerAsync = (
  callback: ReceivingMessageFuncAsync
) => {
  console.log("removing message listener");
  chrome.runtime.onMessage.removeListener(callback);
};
```

Here is how you would use the event listener:

```javascript
addMessageListener(
  MessageTypes.ASK_VIDEO_ID,
  async (message, sender, sendResponse) => {
    const videoId = await getTheVideoId();
    sendResponse({ videoId });
  }
);
```

#### Sync messaging

```javascript
export const addMessageListenerSync = (
  receivingMessage: Message,
  func: ReceivingMessageFuncSync
) => {
  const messageCallback = (
    message: SendingMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    if (message.type === receivingMessage) {
      func(message, sender, sendResponse);
    }
  };
  chrome.runtime.onMessage.addListener(messageCallback);

  return messageCallback;
};
```

```javascript
export const removeMessageListenerSync = (
  callback: ReceivingMessageFuncSync
) => {
  console.log("removing message listener");
  chrome.runtime.onMessage.removeListener(callback);
};
```

## Commands

We can specify keyboard shortcuts using the `commands` API in chrome. All we have to do is create our command as a key, which we do here as `"save_bookmark"`, and then specify the keyboard shortcuts under `"suggested_key"`, and the description of the shortcut under `"description"`.

```json
// manifest.json
{
  ..., // Other manifest.json properties
  "commands": {
    "save_bookmark": {
      "suggested_key": {
        "default": "Ctrl+B",
        "linux": "Ctrl+B",
        "mac": "Command+B"
      },
      "description": "Bookmark the timestamp youtube"
    }
  }
}
```

There are no need to use any permissions. We can then use the `commands` API to listen for the keyboard shortcut, and then execute a function when the keyboard shortcut is pressed. We use the `commands` API in the background script like this:

```javascript
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "save_bookmark") {
    // execute code for shortcut
  }
});
```

Here, `command` is the literal string keyboard shortcut name we defined in the `manifest.json`. In the implementation below, I used the keyboard shortcut trigger to send a message to the content script.

```javascript
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "save_bookmark") {
    const videoId = await getTheVideoId();
    if (!videoId) return;
    // send message, with payload
    const response = await sendMessageToContentScript(
      MessageTypes.ADD_BOOKMARK,
      { videoId }
    );
  }
});
```

## Automatically injecting content scripts

### Getting the youtube video Id

We can take advantage of the fact that we can't access the tab url unless the site we have host permissions enabled for the site we're currently on. If we only have host permissions for youtube, the `tab.url` property will be `undefined` for every site other than youtube.

```javascript
export async function getTheVideoId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];

  // tab.url will only be populated if command is triggered form one of the allowed host permission urls
  // if not on host permission site, exit.
  if (!currentTab?.url) {
    return;
  }

  const queryParams = currentTab.url.split("?")[1];
  if (!queryParams) return;
  const urlParams = new URLSearchParams(queryParams);
  const videoId = urlParams.get("v");
  return videoId;
}
```

### Listening for tab changes

We can automatically inject content scripts whenever the user navigates to or refreshes a page. We can do this by using the `chrome.tabs.onActivated` and `chrome.tabs.onUpdated` listeners. We can use these listeners to inject content scripts like this:

```javascript
chrome.tabs.onActivated.addListener(async (tab) => {
  // gets youtube video id. returns null if not on youtube
  const videoId = await getTheVideoId();
  if (!videoId) return;

  await chrome.scripting.executeScript({
    files: ["contentScript.js"],
    target: { tabId: tab.tabId },
  });
  console.log("script injectied from onActivated listener");
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.status !== "complete") return;

  // gets youtube video id. returns null if not on youtube
  const videoId = await getTheVideoId();
  if (!videoId) return;

  await chrome.scripting.executeScript({
    files: ["contentScript.js"],
    target: { tabId: tabId },
  });
  console.log("script injectied from onUpdated listener");
});
```

- `chrome.tabs.onActivated` : triggered when the user navigates to a new tab.
- `chrome.tabs.onUpdated` : triggered when tab url is updated.

We then use the `chrome.scripting.executeScript` API to inject the content script into the specified tab, which is the tab we're currently on.

Here are the arguments you can pass in to the event listener:

- `tabId` : the id of the tab that was updated
- `tab` : the tab that was updated
- `changeInfo` : an object of all properties from the tab that were updated after the event trigger

### preventing additional injections

## Tab system

```javascript
import { SavedVideos } from "./SavedVideos";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App: React.FC<{}> = () => {
  const [tab, setTab] =
    (React.useState < "currentVideo") | ("savedVideos" > "currentVideo");
  return (
    <>
      <div className="tabs">
        {/* current video tab */}
        <div
          className={`current ${tab === "currentVideo" ? "current-tab" : ""}`}
          onClick={() => setTab("currentVideo")}
        >
          Current Video
        </div>
        {/* saved videos tab */}

        <div
          className={`saved ${tab === "savedVideos" ? "current-tab" : ""}`}
          onClick={() => setTab("savedVideos")}
        >
          Saved Videos
        </div>
      </div>
      {/* conditionally render current video or saved videos depending on tab state */}
      {tab === "currentVideo" ? <CurrentVideo /> : <SavedVideos />}
      <ToastContainer />
    </>
  );
};
```

## React toastify

Here are a few things to keep in mind when using react toastify:

1. Always render it at the top level of your app, as the last element, bounded by a react fragment.
2. You can customize the style using the `style` prop on the `<ToastContainer>` component.
3. If something looks weird, it's probably because you didn't import the css

```javascript
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App: React.FC<{}> = () => {
  return (
    <>
      <div>App</div>
      <ToastContainer />
    </>
  );
};
```

Here is how you can use the `toast()` method:

```javascript
toast("Copied to clipboard", {
  autoClose: 1000,
});
```

Here is how you can apply custom styling:

```javascript
const Modal = () => {
  // move toast down 8 rems
  return <ToastContainer style={{ top: "8rem" }} />;
};
```

## Copying text

We can use the `clipboard` API to copy text to the clipboard. We can use the `navigator.clipboard.writeText()` method to copy text to the clipboard. We can use it like this:

```javascript
navigator.clipboard.writeText(JSON.stringify(videos));
```

## Rendering in React

```javascript
import { createRoot } from "react-dom/client";

const Modal = () => {
  return <ToastContainer style={{ top: "8rem" }} />;
};

const modalContainer = document.createElement("div");
modalContainer.id = "modal-container";
const root = createRoot(modalContainer);

// if modal container doesn't exist, create it. Else we don't want to re-render it.
if (!document.body.querySelector("#modal-container")) {
  document.body.appendChild(modalContainer);
  // render this react component as the child of modalContainer
  root.render(<Modal />);
}
```

Here are the essential steps for rending a react component as DOM elements:

1. Create a container element, like a div, and give it an id and anything else you need to put on the container element.
2. Create a root element using the `createRoot()` method. Pass in the container element as an argument. This returns a `root`, a sort of entry point to render your main react component, like `<App />`.
3. Check if the container element exists. We don't want to unnecessarily keep adding the same element over and over again when we inject our content script. If it doesn't exist, append it to the body and render it with `root.render(<Component />)`.
