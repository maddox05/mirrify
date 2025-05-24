// Import libraries for ZIP creation
importScripts("lib/jszip.min.js");
importScripts("helpers.js");

// Global variables
let isDownloading = false;
let downloadedFiles = [];
let hitUrls = new Set(); // Track hit URLs to prevent duplicates
let pendingUrls = new Set(); // Track URLs that are being downloaded
let baseUrl = "";
let jszip = null;
let activeTabId = null; // Track the active tab ID

console.log("Background script initialized");

// Function to handle network requests
async function handleRequest(details) {
  if (!isDownloading) {
    console.log("Download not active, ignoring request:", details.url);
    return;
  }

  // Check if we've already downloaded this URL
  if (hitUrls.has(details.url)) {
    console.log("Skipping already downloaded URL:", details.url);
    return;
  }

  // Only process requests from the active tab
  if (details.tabId !== activeTabId) {
    console.log("Ignoring request from different tab:", {
      url: details.url,
      requestTabId: details.tabId,
      activeTabId: activeTabId,
    });
    return;
  }

  // Only process specific resource types that are typically visible in network tab
  const allowedTypes = [
    "main_frame", // Main HTML document
    "sub_frame", // iframes
    "stylesheet", // CSS files
    "script", // JavaScript files
    "image", // Images
    "font", // Font files
    "media", // Video/audio
    "xmlhttprequest", // AJAX requests
    "fetch", // Fetch requests
    "json", // JSON files
  ];

  if (!allowedTypes.includes(details.type)) {
    console.log("Skipping non-essential resource:", {
      url: details.url,
      type: details.type,
    });
    return;
  }

  // Skip data URLs and blob URLs
  if (details.url.startsWith("data:") || details.url.startsWith("blob:")) {
    console.log("Skipping data/blob URL:", details.url);
    return;
  }

  // Skip chrome-extension URLs
  if (details.url.startsWith("chrome-extension://")) {
    console.log("Skipping chrome-extension URL:", details.url);
    return;
  }

  // Add to pending URLs
  pendingUrls.add(details.url);
  updatePendingCount();

  console.log("Processing request:", {
    url: details.url,
    type: details.type,
    statusCode: details.statusCode,
  });

  // Mark this URL as being hit
  hitUrls.add(details.url);

  try {
    // Fetch the resource
    const response = await fetch(details.url);
    console.log("Fetch response:", {
      url: details.url,
      status: response.status,
      type: response.type,
    });

    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();
    console.log(
      "Got array buffer for:",
      details.url,
      "Size:",
      arrayBuffer.byteLength
    );

    const fileData = new Uint8Array(arrayBuffer);

    // Normalize URL to create a path in the ZIP
    const normalizedUrl = normalizeUrl(baseUrl, details.url);
    const filePath = sanitizeFilename(normalizedUrl);

    console.log("Adding file to ZIP:", {
      originalUrl: details.url,
      normalizedPath: filePath,
    });

    // Store file data in ZIP
    jszip.file(filePath, fileData);

    // Add to list of downloaded files
    downloadedFiles.push(normalizedUrl);

    // Remove from pending URLs
    pendingUrls.delete(details.url);
    updatePendingCount();

    // Notify side panel about downloaded file
    chrome.runtime.sendMessage({
      type: "fileDownloaded",
      filePath: filePath,
    });

    // Update storage
    chrome.storage.local.set({
      fileCount: downloadedFiles.length,
    });

    console.log("File processed successfully:", filePath);
  } catch (error) {
    console.error("Error downloading file:", {
      url: details.url,
      error: error.message,
    });
    // Remove from pending URLs on error
    pendingUrls.delete(details.url);
    updatePendingCount();
  }
}

// Function to update pending count
function updatePendingCount() {
  chrome.runtime.sendMessage({
    type: "pendingUpdate",
    pendingCount: pendingUrls.size,
    pendingUrls: Array.from(pendingUrls),
  });
}

// Start downloading process
function startDownload(url, tabId) {
  console.log("Starting download for URL:", url, "Tab ID:", tabId);

  if (isDownloading) {
    console.log("Download already in progress, ignoring start request");
    return;
  }

  isDownloading = true;
  downloadedFiles = [];
  hitUrls.clear(); // Clear the set of downloaded URLs
  baseUrl = findActualBaseUrl(url);
  jszip = new JSZip();
  activeTabId = tabId; // Store the tab ID

  console.log("Initialized new download session");

  // Update the download state in storage
  chrome.storage.local.set({
    downloadActive: true,
    fileCount: 0,
  });

  // Notify side panel that download started
  chrome.runtime.sendMessage({ type: "downloadStarted" });

  // Add webRequest listener to capture resources - use onCompleted for successful requests
  // With activeTab permission, Chrome scopes this automatically to the active tab
  chrome.webRequest.onBeforeRequest.addListener(handleRequest, {
    urls: ["<all_urls>"], // activeTab permission should scope this to current tab
  });

  console.log("Download session started successfully");
}

// Stop download and create ZIP file
async function stopDownload() {
  console.log("Stopping download and creating ZIP file");

  if (!isDownloading) {
    console.log("No download in progress, ignoring stop request");
    return;
  }

  isDownloading = false;

  // Remove listener
  chrome.webRequest.onCompleted.removeListener(handleRequest);

  // Reset the active tab ID
  activeTabId = null;

  // Update storage
  chrome.storage.local.set({
    downloadActive: false,
  });

  console.log("Starting ZIP file generation");

  try {
    // Generate ZIP file with maximum compatibility settings
    const content = await jszip.generateAsync({
      type: "blob",
      compression: "STORE", // No compression for maximum compatibility
      mimeType: "application/zip",
      // Basic ZIP format settings
      zip64: false,
      date: new Date(),
      // Ensure proper file attributes
      createFolders: true,
      // Use basic ZIP format
      streamFiles: false,
    });
    console.log("ZIP file generated, size:", content.size);

    // Create a domain name for the zip file
    let domain = "";
    try {
      domain = sanitizeFilename(new URL(baseUrl).hostname);
    } catch (e) {
      domain = "downloaded-site";
    }

    // Convert blob to base64 data URL with proper MIME type
    const base64data = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Ensure proper MIME type in data URL
        const dataUrl = reader.result.replace(
          "application/octet-stream",
          "application/zip"
        );
        resolve(dataUrl);
      };
      reader.readAsDataURL(content);
    });
    console.log("Converted ZIP to base64 data URL");

    // Create download with explicit MIME type
    chrome.downloads.download(
      {
        url: base64data,
        filename: `${domain}.zip`,
        saveAs: true,
        conflictAction: "uniquify",
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error("Download failed:", chrome.runtime.lastError);
          return;
        }
        console.log("Download started with ID:", downloadId);
      }
    );

    // Notify side panel
    chrome.runtime.sendMessage({ type: "downloadStopped" });

    console.log("Download initiated for ZIP file:", {
      filename: `${domain}.zip`,
      fileCount: downloadedFiles.length,
    });
  } catch (error) {
    console.error("Error in ZIP file creation:", error);
    // Notify side panel of error
    chrome.runtime.sendMessage({
      type: "downloadError",
      error: "Failed to create ZIP file. Please try again.",
    });
  }
}

// Listen for messages from side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);

  if (message.type === "startDownload") {
    startDownload(message.url, message.tabId);
  } else if (message.type === "stopDownload") {
    stopDownload();
  }
});

// Handle extension icon click to open side panel
chrome.action.onClicked.addListener((tab) => {
  console.log("Extension icon clicked, opening side panel");
  chrome.sidePanel.open({ windowId: tab.windowId });
});
