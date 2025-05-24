/**
 * if we start from a index.html file, it will remove the index.html from the url and return it
 * @param {string} url
 * @returns {string}
 */
function findActualBaseUrl(url) {
  // if end of url isnt / and isnt .html then add a slash
  if (!url.endsWith("/") && !url.endsWith(".html")) {
    return url + "/";
  } else if (url.includes(".html")) {
    const urlArr = url.split("/");
    urlArr.pop(); // will also pop ?
    return urlArr.join("/");
  } else if (url.includes("?")) {
    return findActualBaseUrl(url.split("?")[0]); //filename.split("?")[0] index.htnl ? x=y z=b messing up base folder
    // and its recursive because after removing ? it could still be a index.html file
  } else {
    return url;
  }
}

/**
 * normalizes by the base, bascially removing the base from the url and returning the rest of the url
 * if the url is the base, it returns index.html
 * @param {string} baseUrl
 * @param {string} url
 * @returns {string}
 */
function normalizeUrl(baseUrl, url) {
  if (url.includes(baseUrl)) {
    return url.split(baseUrl)[1] ? url.split(baseUrl)[1] : "index.html"; // if we are on x/ then we must be currently on a index.html file
  } else {
    return url;
  }
}

// Map to store directory aliases
const directoryAliases = new Map();
let aliasCounter = 0;

/**
 * Creates a short alias for a long directory name
 * @param {string} dirName - The directory name to create an alias for
 * @returns {string} - The alias for the directory
 */
function createDirectoryAlias(dirName) {
  if (directoryAliases.has(dirName)) {
    return directoryAliases.get(dirName);
  }
  const alias = `d${aliasCounter++}`;
  directoryAliases.set(dirName, alias);
  return alias;
}

/**
 * Handles long paths by creating aliases for long directory names
 * @param {string} path - The path to process
 * @returns {string} - The processed path with aliases
 */
function handleLongPath(path) {
  const MAX_PATH_LENGTH = 256;
  if (path.length <= MAX_PATH_LENGTH) {
    return path;
  }

  const parts = path.split("/");
  const result = [];
  let currentLength = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.length > 32) {
      // If directory name is too long
      const alias = createDirectoryAlias(part);
      result.push(alias);
      currentLength += alias.length + 1; // +1 for the slash
    } else {
      result.push(part);
      currentLength += part.length + 1;
    }
  }

  return result.join("/");
}

function sanitizeFilename(filename) {
  console.log("Sanitizing filename:", filename);

  // First decode URI components like %20 (space) and %7C (pipe)
  const decoded = decodeURIComponent(filename);
  // Then apply the existing sanitization
  const sanitized = splitAndReturnFirst(decoded, "?").replaceAll(
    /[^a-z0-9./_\- )(]/gi,
    "_"
  );

  // Handle long paths
  const processedPath = handleLongPath(sanitized);

  console.log("Sanitized filename result:", processedPath);
  return processedPath;
}

/**
 *
 * @param {string} haystack
 * @param {string} needle
 */
function splitAndReturnFirst(haystack, needle) {
  return haystack.split(needle)[0];
}
