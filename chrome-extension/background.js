// Membangun context menu saat ekstensi di-install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "send-to-athlos",
    title: "Tanyakan ke Athlos AI",
    contexts: ["selection"] // Muncul hanya saat teks diblok
  });
});

// Menangkap event klik pada context menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "send-to-athlos") {
    const selectedText = info.selectionText;
    
    chrome.storage.sync.get(["athlosUrl"], (data) => {
      let baseUrl = data.athlosUrl || "http://localhost:3000";
      // Pastikan tidak ada trailing slash
      if(baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
      
      // Buka tab baru menuju Athlos Chat dengan query parameter prompt
      const targetUrl = `${baseUrl}/chat?prompt=${encodeURIComponent("Tolong jelaskan mengenai teks berikut:\n\n> " + selectedText)}`;
      chrome.tabs.create({ url: targetUrl });
    });
  }
});
