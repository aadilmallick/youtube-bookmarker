/**********************************************
 *                                           *
 *            Typing                          *
 *                                           *
 **********************************************/

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

type responseCallback = (response?) => void;

/**********************************************
 *                                           *
 *            sending messages                        *
 *                                           *
 **********************************************/

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

// * works ✅
export const sendMessageFromContentScript = async (
  message: Message,
  payload?: SendingMessage["payload"]
): Promise<any> => {
  return chrome.runtime.sendMessage({ type: message, payload: payload || {} });
};

/**********************************************
 *                                           *
 *            receiving messages                        *
 *                                           *
 **********************************************/

type ReceivingMessageFunc = (
  message?: SendingMessage,
  sender?: chrome.runtime.MessageSender,
  sendResponse?: (response?: any) => void
) => Promise<void>;

// * works ✅
/**
 *
 * @desc to avoid error, you must send a response in the callback function.
 */
export const addMessageListener = (
  receivingMessage: Message,
  func: ReceivingMessageFunc
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

export const removeMessageListener = (callback: ReceivingMessageFunc) => {
  console.log("removing message listener");
  chrome.runtime.onMessage.removeListener(callback);
};
