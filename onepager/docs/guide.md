# Mirrify Guide:

## What is Mirrify?

Mirrify is a powerful tool designed to download a complete website's request tree - capturing everything your browser would request when visiting the site. This makes it ideal for creating offline copies of websites, analyzing site structure, or recreating sites locally.

## Core Functionality

Mirrify works by:

1. Opening a browser session
2. Opening the network panel & disabling caching
3. Recording all requests made by the browser
4. Saving these files in an organized structure
5. Enabling you to recreate or analyze the site offline

## How Files Are Stored

Mirrify organizes downloaded files into two main categories:

### Relative Requests

- **What they are**: Resources loaded from the same domain as the original site
- **Example**: If downloading `https://maddox.page/index.html`, a relative request might be `https://maddox.page/favicon.ico`
- **Where they're stored**: At the root of your output directory

### Non-Relative Requests

- **What they are**: Resources loaded from external domains (CDNs, third-party services, etc.)
- **Example**: Loading `https://cdn.example.com/script.js` while on `maddox.page`
- **Where they're stored**: In `https/...` with subdirectories matching the original path structure

## Using Mirrify Step-by-Step

1. **Launch Mirrify** open the target website, click download, then refresh the page.
2. **Browse the site** - click through pages, interact with elements
   - Mirrify captures all requests in the background
3. **Download completes** when you've finished browsing or the site is fully traversed. Click Stop Download.

## Creating Local Copies of Websites

### For Simple Sites (Only Relative Links)

- The downloaded files at your output root can be directly used

### For Complex Sites (With Non-Relative Links)

1.  **Identify external resource files** in your `https/` directory
2.  **Modify path references** in your HTML/JS files:

    **Example workflow:**

    1. Find external resource at `output/https/cdn.x.com/outerfile.js`
    2. Copy this file to your local site recreation directory
    3. Edit the HTML reference from:
       ```html
       <script src="https://cdn.x.com/outerfile.js"></script>
       ```
       To:
       ```html
       <script src="outerfile.js"></script>
       ```

## Advanced Usage Tips

- **Interactive Traversal**: Mirrify opens a browser interface allowing you to navigate the site naturally while capturing all resources
- **Comprehensive Capture**: All resources loaded by JavaScript, CSS, and other dynamic elements are captured
- **Selective Downloading**: You can focus on specific sections of a site by only browsing those areas

## Requirements

- Basic understanding of web structure (HTML, CSS, JS)
- For complex site recreation: familiarity with editing HTML/JS references

## Common Use Cases

- Creating offline archives of websites
- Archiving HTML Games
- Website analysis and structure mapping
- Preparing sites for local development
- Educational purposes - studying site architecture

---

_While Mirrify is designed to be accessible for all users, web development knowledge will help you get the most out of this powerful tool._
