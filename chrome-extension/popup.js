document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('urlInput');
  const saveBtn = document.getElementById('saveBtn');
  const openBtn = document.getElementById('openBtn');

  // Load saved URL
  chrome.storage.sync.get(['athlosUrl'], (data) => {
    urlInput.value = data.athlosUrl || 'http://localhost:3000';
  });

  saveBtn.addEventListener('click', () => {
    chrome.storage.sync.set({ athlosUrl: urlInput.value }, () => {
      saveBtn.textContent = 'Tersimpan!';
      saveBtn.style.background = '#16a34a';
      setTimeout(() => {
        saveBtn.textContent = 'Simpan Pengaturan';
        saveBtn.style.background = '#ea580c';
      }, 2000);
    });
  });

  openBtn.addEventListener('click', () => {
    let url = urlInput.value;
    if(url.endsWith('/')) url = url.slice(0, -1);
    chrome.tabs.create({ url: url + '/chat' });
  });
});
