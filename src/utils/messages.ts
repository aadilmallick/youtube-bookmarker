/**********************************************
 *                                           *
 *            Typing                          *
 *                                           *
 **********************************************/

export enum MessageTypes {
  SAVE_VIDEO = "SAVE_VIDEO",
  ASK_VIDEO_ID = "ASK_VIDEO_ID",
}

export type SendingMessage = {
  type: Message;
  payload?: { videoId?: string; videoTitle?: string };
};

export type Message = keyof typeof MessageTypes;

type responseCallback = (response?) => void;

/**********************************************
 *                                           *
 *            sending messages                        *
 *                                           *
 **********************************************/

export const sendMessageToContentScript = async (
  message: Message,
  payload?: SendingMessage["payload"],
  responseCallback?: responseCallback
) => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const responseFunc =
    responseCallback ||
    function (response) {
      return true;
    };
  chrome.tabs.sendMessage(
    tabs[0].id!,
    {
      type: message,
      payload,
    },
    responseFunc
  );
};

// ? switched parameter order
export const sendMessageFromContentScript = async (
  message: Message,
  payload?: SendingMessage["payload"],
  responseCallback?: responseCallback
) => {
  const responseFunc =
    responseCallback ||
    function (response) {
      return true;
    };
  chrome.runtime.sendMessage({ type: message, payload }, responseFunc);
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
) => void;

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
      func(message, sender, sendResponse);
      sendResponse();
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
