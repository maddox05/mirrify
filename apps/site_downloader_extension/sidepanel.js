// Side panel script for the Mirrify extension

console.log("Side panel script initialized");

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM Content Loaded - initializing UI elements");

  const startButton = document.getElementById("startDownload");
  const stopButton = document.getElementById("stopDownload");
  const statusText = document.getElementById("statusText");
  const fileCounter = document.getElementById("fileCounter");
  const fileList = document.getElementById("fileList");
  const pendingList = document.getElementById("pendingList");
  const pendingCounter = document.getElementById("pendingCounter");
  const baseUrlElement = document.getElementById("baseUrl");

  let downloadActive = false;
  let fileCount = 0;
  let pendingCount = 0;

  // Headers functionality
  const headersToggle = document.getElementById("headersToggle");
  const headersContent = document.getElementById("headersContent");
  const headersTextarea = document.getElementById("headersTextarea");

  // Toggle headers section
  headersToggle.addEventListener("click", function () {
    const isExpanded = headersContent.classList.contains("show");
    if (isExpanded) {
      headersContent.classList.remove("show");
      headersToggle.classList.remove("expanded");
    } else {
      headersContent.classList.add("show");
      headersToggle.classList.add("expanded");
    }
  });

  // Function to parse headers from textarea
  function parseHeaders() {
    const headersText = headersTextarea.value.trim();
    if (!headersText) return {};

    const headers = {};
    const lines = headersText.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const colonIndex = trimmed.indexOf(":");
      if (colonIndex > 0) {
        const headerName = trimmed.substring(0, colonIndex).trim();
        const headerValue = trimmed.substring(colonIndex + 1).trim();
        if (headerName && headerValue) {
          headers[headerName] = headerValue;
        }
      }
    }

    return headers;
  }

  // Load saved headers from storage
  chrome.storage.local.get(["customHeaders"], function (result) {
    if (result.customHeaders) {
      headersTextarea.value = result.customHeaders;
    }
  });

  // Save headers when they change
  headersTextarea.addEventListener("input", function () {
    chrome.storage.local.set({ customHeaders: headersTextarea.value });
  });

  // // Check if download is already in progress when side panel opens
  // chrome.storage.local.get(["downloadActive", "fileCount"], function (result) {
  //   console.log("Checking initial download state:", result);

  //   if (result.downloadActive) {
  //     console.log("Found active download session, restoring state");
  //     downloadActive = true;
  //     fileCount = result.fileCount || 0;
  //     updateUI();
  //   } else {
  //     console.log("No active download session found");
  //   }
  // });

  // Update file counter and list when new files are downloaded
  chrome.runtime.onMessage.addListener(function (message) {
    console.log("Received message in side panel:", message);

    if (message.type === "fileDownloaded") {
      console.log("Processing new file:", message.filePath);
      fileCount++;
      fileCounter.textContent = `Files Downloaded: ${fileCount}`;

      // Add file to the list
      const fileItem = document.createElement("div");
      fileItem.className = "file-item";
      fileItem.textContent = message.filePath;
      fileList.appendChild(fileItem);

      // Scroll to bottom of file list
      fileList.scrollTop = fileList.scrollHeight;

      chrome.storage.local.set({ fileCount: fileCount });
      console.log("Updated file count:", fileCount);
    } else if (message.type === "pendingUpdate") {
      pendingCount = message.pendingCount;
      pendingCounter.textContent = `Files Pending: ${pendingCount}`;

      // Update pending list
      pendingList.innerHTML = "";
      message.pendingUrls.forEach((url) => {
        const pendingItem = document.createElement("div");
        pendingItem.className = "pending-item";
        pendingItem.textContent = url;
        pendingList.appendChild(pendingItem);
      });

      // Scroll to bottom of pending list
      pendingList.scrollTop = pendingList.scrollHeight;
    } else if (message.type === "downloadStarted") {
      console.log("Download session started");
      downloadActive = true;
      updateUI();
      // Clear file list when starting new download
      fileList.innerHTML = "";
      pendingList.innerHTML = "";
      fileCount = 0;
      pendingCount = 0;
      fileCounter.textContent = "Files Downloaded: 0";
      pendingCounter.textContent = "Files Pending: 0";
      if (baseUrlElement) {
        baseUrlElement.textContent = message.baseUrl || "No URL selected";
      }
      console.log("Cleared file lists");
    } else if (message.type === "downloadStopped") {
      console.log("Download session stopped");
      downloadActive = false;
      if (baseUrlElement) {
        baseUrlElement.textContent = "Click Start Download to begin";
      }
      updateUI();
    }
  });

  startButton.addEventListener("click", function () {
    console.log("Start button clicked");

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      console.log("Current tab:", currentTab);
      // veify currentTab is not undefined
      if (!currentTab.url) {
        window.alert(
          "Tab found, but no URL found, please close the side panel (mirrify) and try again"
        );
        return;
      }
      console.log("Current tab URL:", currentTab.url, "Tab ID:", currentTab.id);

      // Reset counter when starting new download
      fileCount = 0;
      chrome.storage.local.set({ fileCount: 0 });
      fileCounter.textContent = "Files Downloaded: 0";
      console.log("Reset file counter");

      // Parse custom headers
      const customHeaders = parseHeaders();
      console.log("Parsed custom headers:", customHeaders);

      // Tell background script to start downloading
      chrome.runtime.sendMessage({
        type: "startDownload",
        url: currentTab.url,
        tabId: currentTab.id, // Pass the tab ID to the background script
        headers: customHeaders, // Pass custom headers
      });
      console.log(
        "Sent start download message to background script with tab ID:",
        currentTab.id
      );

      downloadActive = true;
      updateUI();
    });
  });

  stopButton.addEventListener("click", function () {
    console.log("Stop button clicked");
    chrome.runtime.sendMessage({ type: "stopDownload" });
    statusText.textContent = "Creating ZIP file...";
    console.log("Sent stop download message to background script");
  });

  function updateUI() {
    console.log("Updating UI state:", { downloadActive, fileCount });

    if (downloadActive) {
      startButton.disabled = true;
      stopButton.disabled = false;
      statusText.textContent = "Downloading in progress...";
      console.log("UI updated: Download active");
    } else {
      startButton.disabled = false;
      stopButton.disabled = true;
      statusText.textContent = "Ready to download";
      console.log("UI updated: Download inactive");
    }
  }

  // Listen for side panel close
  chrome.sidePanel.onClose.addListener(() => {
    console.log("Side panel closed - cleaning up");
    if (downloadActive) {
      // Stop any active download
      chrome.runtime.sendMessage({ type: "stopDownload" });
      downloadActive = false;
    }
    // Reset UI state
    fileCount = 0;
    fileCounter.textContent = "Files Downloaded: 0";
    fileList.innerHTML = "";
    pendingList.innerHTML = "";
    pendingCount = 0;
    pendingCounter.textContent = "Files Pending: 0";
    statusText.textContent = "Ready to download";
    startButton.disabled = false;
    stopButton.disabled = true;
    if (baseUrlElement) {
      baseUrlElement.textContent = "No URL selected";
    }
  });
});
