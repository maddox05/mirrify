/**
 * Test suite for helpers.js functions
 */

// Import the functions to test from the Node.js compatible version
const {
  findActualBaseUrl,
  normalizeUrl,
  createDirectoryAlias,
  handleLongPath,
  sanitizeFilename,
  splitAndReturnFirst,
  directoryAliases,
  resetAliasCounter,
  clearDirectoryAliases,
} = require("../helpers.js");

// Reset state before each test
beforeEach(() => {
  clearDirectoryAliases();
  resetAliasCounter();
});

describe("findActualBaseUrl", () => {
  test("should add trailing slash to URL without slash or .html", () => {
    expect(findActualBaseUrl("https://example.com")).toBe(
      "https://example.com/"
    );
    expect(findActualBaseUrl("https://example.com/subfolder")).toBe(
      "https://example.com/subfolder/"
    );
  });

  test("should return URL as-is if it already ends with slash", () => {
    expect(findActualBaseUrl("https://example.com/")).toBe(
      "https://example.com/"
    );
    expect(findActualBaseUrl("https://example.com/subfolder/")).toBe(
      "https://example.com/subfolder/"
    );
  });

  test("should remove .html file and add trailing slash", () => {
    expect(findActualBaseUrl("https://example.com/index.html")).toBe(
      "https://example.com/"
    );
    expect(findActualBaseUrl("https://example.com/subfolder/page.html")).toBe(
      "https://example.com/subfolder/"
    );
    expect(findActualBaseUrl("https://example.com/deep/nested/file.html")).toBe(
      "https://example.com/deep/nested/"
    );
  });

  test("should handle query parameters by removing them first", () => {
    expect(findActualBaseUrl("https://example.com?param=value")).toBe(
      "https://example.com/"
    );
    expect(
      findActualBaseUrl("https://example.com/index.html?param=value")
    ).toBe("https://example.com/");
    expect(findActualBaseUrl("https://example.com/subfolder?x=y&z=b")).toBe(
      "https://example.com/subfolder/"
    );
  });

  test("should handle complex URLs with both .html and query parameters", () => {
    expect(
      findActualBaseUrl("https://example.com/page.html?id=123&sort=date")
    ).toBe("https://example.com/");
    expect(
      findActualBaseUrl("https://example.com/blog/post.html?comments=true")
    ).toBe("https://example.com/blog/");
  });

  test("should handle edge cases", () => {
    expect(findActualBaseUrl("https://example.com/file.html?")).toBe(
      "https://example.com/"
    );
    expect(findActualBaseUrl("https://example.com/?")).toBe(
      "https://example.com/"
    );
  });
});

describe("normalizeUrl", () => {
  test("should return relative path when URL contains base URL", () => {
    const baseUrl = "https://example.com/";
    expect(normalizeUrl(baseUrl, "https://example.com/styles.css")).toBe(
      "styles.css"
    );
    expect(normalizeUrl(baseUrl, "https://example.com/js/script.js")).toBe(
      "js/script.js"
    );
    expect(normalizeUrl(baseUrl, "https://example.com/images/logo.png")).toBe(
      "images/logo.png"
    );
  });

  test('should return "index.html" when URL is exactly the base URL', () => {
    const baseUrl = "https://example.com/";
    expect(normalizeUrl(baseUrl, "https://example.com/")).toBe("index.html");
    expect(normalizeUrl(baseUrl, "https://example.com")).toBe("index.html");
  });

  test("should return original URL when it does not contain base URL", () => {
    const baseUrl = "https://example.com/";
    expect(normalizeUrl(baseUrl, "https://other-domain.com/file.css")).toBe(
      "https://other-domain.com/file.css"
    );
    expect(normalizeUrl(baseUrl, "https://cdn.example.org/script.js")).toBe(
      "https://cdn.example.org/script.js"
    );
  });

  test("should handle subdirectory base URLs", () => {
    const baseUrl = "https://example.com/app/";
    expect(normalizeUrl(baseUrl, "https://example.com/app/main.css")).toBe(
      "main.css"
    );
    expect(
      normalizeUrl(baseUrl, "https://example.com/app/components/button.js")
    ).toBe("components/button.js");
    expect(normalizeUrl(baseUrl, "https://example.com/app/")).toBe(
      "index.html"
    );
  });

  test("should handle complex scenarios", () => {
    const baseUrl = "https://example.com/blog/";
    expect(
      normalizeUrl(baseUrl, "https://example.com/blog/posts/article.html")
    ).toBe("posts/article.html");
    expect(normalizeUrl(baseUrl, "https://example.com/blog")).toBe(
      "https://example.com/blog"
    );
    expect(normalizeUrl(baseUrl, "https://example.com/")).toBe(
      "https://example.com/"
    );
  });
});

describe("sanitizeFilename", () => {
  test("should remove invalid characters from filename", () => {
    expect(sanitizeFilename("file<name>.txt")).toBe("file_name_.txt");
    expect(sanitizeFilename("file|name.txt")).toBe("file_name.txt");
    expect(sanitizeFilename("file?name.txt")).toBe("file_name.txt");
  });

  test("should handle query parameters by removing them", () => {
    expect(sanitizeFilename("script.js?v=1.2.3")).toBe("script.js");
    expect(sanitizeFilename("style.css?timestamp=123456")).toBe("style.css");
    expect(sanitizeFilename("image.png?size=large&format=webp")).toBe(
      "image.png"
    );
  });

  test("should decode URI components", () => {
    expect(sanitizeFilename("file%20name.txt")).toBe("file name.txt");
    expect(sanitizeFilename("path%2Fto%2Ffile.js")).toBe("path_to_file.js");
  });

  test("should preserve allowed characters", () => {
    expect(sanitizeFilename("valid-file_name.123.txt")).toBe(
      "valid-file_name.123.txt"
    );
    expect(sanitizeFilename("folder/subfolder/file.js")).toBe(
      "folder/subfolder/file.js"
    );
    expect(sanitizeFilename("file (copy).txt")).toBe("file (copy).txt");
  });

  test("should handle long paths with aliases", () => {
    const longPath =
      "very-long-directory-name-that-exceeds-limits/another-very-long-directory/file.txt";
    const result = sanitizeFilename(longPath);
    expect(result).toContain("d0"); // Should contain directory alias
    expect(result).toContain("file.txt"); // Should preserve filename
  });
});

describe("splitAndReturnFirst", () => {
  test("should return first part when needle is found", () => {
    expect(splitAndReturnFirst("hello?world", "?")).toBe("hello");
    expect(splitAndReturnFirst("path/to/file.js", "/")).toBe("path");
    expect(splitAndReturnFirst("name=value&other=data", "&")).toBe(
      "name=value"
    );
  });

  test("should return entire string when needle is not found", () => {
    expect(splitAndReturnFirst("hello world", "?")).toBe("hello world");
    expect(splitAndReturnFirst("filename.txt", "|")).toBe("filename.txt");
  });

  test("should handle empty strings and edge cases", () => {
    expect(splitAndReturnFirst("", "?")).toBe("");
    expect(splitAndReturnFirst("test", "")).toBe("");
    expect(splitAndReturnFirst("?second", "?")).toBe("");
  });
});

describe("handleLongPath", () => {
  test("should return path as-is if under max length", () => {
    expect(handleLongPath("short/path")).toBe("short/path");
    expect(handleLongPath("file.txt")).toBe("file.txt");
  });

  test("should create aliases for very long directory names", () => {
    const longDir = "a".repeat(40); // 40 character directory name
    const path = `${longDir}/file.txt`;
    const result = handleLongPath(path);
    expect(result).not.toContain(longDir);
    expect(result).toContain("d"); // Should contain alias
    expect(result).toContain("file.txt");
  });
});

describe("createDirectoryAlias", () => {
  test("should create unique aliases for different directories", () => {
    const alias1 = createDirectoryAlias("very-long-directory-name-1");
    const alias2 = createDirectoryAlias("very-long-directory-name-2");
    expect(alias1).not.toBe(alias2);
    expect(alias1).toMatch(/^d\d+$/);
    expect(alias2).toMatch(/^d\d+$/);
  });

  test("should return same alias for same directory name", () => {
    const dirName = "same-directory-name";
    const alias1 = createDirectoryAlias(dirName);
    const alias2 = createDirectoryAlias(dirName);
    expect(alias1).toBe(alias2);
  });
});

// Integration tests combining multiple functions
describe("Integration Tests", () => {
  test("should handle complete URL processing workflow", () => {
    const originalUrl = "https://example.com/app/index.html?version=1.2.3";
    const baseUrl = findActualBaseUrl(originalUrl);
    expect(baseUrl).toBe("https://example.com/app/");

    const normalizedPath = normalizeUrl(
      baseUrl,
      "https://example.com/app/styles/main.css?v=123"
    );
    expect(normalizedPath).toBe("styles/main.css?v=123");

    const sanitizedFilename = sanitizeFilename(normalizedPath);
    expect(sanitizedFilename).toBe("styles/main.css");
  });

  test("should handle external URLs correctly", () => {
    const baseUrl = "https://mysite.com/";
    const externalUrl = "https://cdn.external.com/library.js";
    const normalizedPath = normalizeUrl(baseUrl, externalUrl);
    expect(normalizedPath).toBe(externalUrl);

    const sanitizedFilename = sanitizeFilename(normalizedPath);
    expect(sanitizedFilename).toContain("cdn.external.com");
  });
});
