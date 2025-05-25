document.addEventListener("DOMContentLoaded", function () {
  const tipsArea = document.getElementById("tipsArea");

  const tips = [
    "Make sure to open the network tab and disable cache for the best results.",
    "Click through all pages and interact with elements to capture all resources.",
    "Mirrify saves all downloaded files into a structured ZIP archive.",
    "Use the 'Stop & Save ZIP' button when you're done browsing.",
    "Check mirrify.io/docs for more detailed instructions and advanced tips.",
    "If a site uses a lot of JavaScript, give it time to load all dynamic content.",
    "You can monitor the 'Files Downloaded' and 'Files Pending' counters.",
    "Mirrify only gets files from the current tab.",
  ];

  let currentTipIndex = 0;

  function displayNextTip() {
    if (tipsArea && tips.length > 0) {
      tipsArea.textContent = tips[currentTipIndex];
      currentTipIndex = (currentTipIndex + 1) % tips.length;
    }
  }

  // Display the first tip immediately
  displayNextTip();

  // Change tip every 7 seconds (7000 milliseconds)
  setInterval(displayNextTip, 7000);
});
