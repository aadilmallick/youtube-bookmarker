/**********************************************
 *                                           *
 *            Typing                          *
 *                                           *
 **********************************************/

interface LocalStorage {}

interface Timestamp {
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

type SyncStorageKeys = (keyof SyncStorage)[];
type LocalStorageKeys = (keyof LocalStorage)[];

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

// export async function addBookmarkSync(bookmark: Video) {
//   await getVideoSync(bookmark.id);
// }
export async function addTimestampSync(
  timestamp: Timestamp,
  videoId: Video["id"],
  videoTitle: Video["title"]
) {
  const videos = await getSyncBookmarks();
  const video = videos.find((video) => video.id === videoId);
  // if video exists, add timestamp to it
  if (video) {
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
// export async function getStoredDarkMode(): Promise<SyncStorage["darkMode"]> {
//   const keys: SyncStorageKeys = ["bookmarks"];
// }

// export const storeSyncBookmarks = async (bookmarks: Bookmark[]) => {

// }
/**********************************************
 *                                           *
 *           getting data                  *
 *                                           *
 **********************************************/

export async function getSyncBookmarks(): Promise<Video[]> {
  const keys: SyncStorageKeys = ["videos"];
  const { videos } = await getSync(keys);
  return videos || [];
}

export async function getVideoSync(id: Video["id"]): Promise<Video[]> {
  const keys: SyncStorageKeys = ["videos"];
  const { videos } = await getSync(keys);
  return videos.filter((video) => video.id === id) || [];
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

/**********************************************
 *                                           *
 *            clearing data                       *
 *                                           *
 **********************************************/

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