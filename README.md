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
16. Make bookmark button more obvious to click on, change hover
17. add export JSON functionality, and then create something to create a table of videos
18. Find a way to reduce the number of times the content script is injected:

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
