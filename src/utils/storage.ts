/**********************************************
 *                                           *
 *            Typing                          *
 *                                           *
 **********************************************/

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

export const defaultSyncOptions: Required<SyncStorage> = {
  options: {},
  videos: [],
};

/**********************************************
 *                                           *
 *            Setting data                        *
 *                                           *
 **********************************************/

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

// delete the specified timestamp by seeing where they match
// any video that has the same timestring as the timestamp, delete that timestamp
export async function deleteTimestampSync(
  timestamp: string,
  videoId: Video["id"]
) {
  if (videoId.length < 4) throw new Error("videoId is required");
  // const video = await getVideoSync(videoId);
  const videos = await getSyncBookmarks();
  const vidIndex = videos.findIndex((video) => video.id === videoId);
  const video = videos[vidIndex];
  if (!video) throw new Error("video not found");
  // remove that one timestamp that we want to delete
  const timestamps = video.timestamps.filter(
    (bookmark) => bookmark.timestamp !== timestamp
  );
  // mutation
  video.timestamps = timestamps;
  videos[vidIndex] = video;
  await storeSync({ videos });
}

export async function deleteVideoSync(videoId: Video["id"]) {
  const videos = await getSyncBookmarks();
  await storeSync({ videos: videos.filter((video) => video.id !== videoId) });
}

export async function editDescriptionSync(
  videoId: Video["id"],
  timestamp: Timestamp
) {
  const videos = await getSyncBookmarks();
  const vidIndex = videos.findIndex((video) => video.id === videoId);
  const video = videos[vidIndex];
  if (!video) throw new Error("video not found");
  const timestampIndex = video.timestamps.findIndex(
    (bookmark) => bookmark.timestamp === timestamp.timestamp
  );
  video.timestamps[timestampIndex].description = timestamp.description;
  videos[vidIndex] = video;
  await storeSync({ videos });
}

function isTimestampUnique(timestamp: Timestamp, video: Video) {
  for (let bookmark of video.timestamps) {
    if (bookmark.timestamp === timestamp.timestamp) {
      return false;
    }
  }
  return true;
}

// export async function addBookmarkSync(bookmark: Video) {
//   await getVideoSync(bookmark.id);
// }
export async function addTimestampSync(
  timestamp: Timestamp,
  videoId: Video["id"],
  videoTitle: Video["title"]
) {
  if (videoId.length < 4) throw new Error("videoId is required");
  const videos = await getSyncBookmarks();
  const video = videos.find((video) => video.id === videoId);
  // if video exists, add timestamp to it
  if (video) {
    // TODO: check if timestamp already exists, by creating helper function
    if (!isTimestampUnique(timestamp, video)) {
      return;
    }
    video.timestamps.push(timestamp);
    await storeSync({ videos });
  } else {
    // else just add a new video
    await storeSync({
      videos: [
        ...videos,
        { id: videoId, timestamps: [timestamp], title: videoTitle },
      ],
    });
  }
}

export async function getSyncBookmarks(): Promise<Video[]> {
  const keys: SyncStorageKeys = ["videos"];
  const { videos } = await getSync(keys);
  return videos || [];
}

export async function getVideoSync(id: Video["id"]): Promise<Video | null> {
  const keys: SyncStorageKeys = ["videos"];
  const { videos } = await getSync(keys);
  return videos.filter((video) => video.id === id)[0] || null;
}

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

/**
 *
 * @returns Promise<void>
 * @description Clears all data from local storage
 */
export function clearAllStorage(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        throw new Error(chrome.runtime.lastError.message);
      }
      resolve();
    });
  });
}

function clearLocal(keys: LocalStorageKeys): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(keys, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        throw new Error(chrome.runtime.lastError.message);
      }
      resolve();
    });
  });
}
