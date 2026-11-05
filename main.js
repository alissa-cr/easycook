const { app, BrowserWindow } = require('electron');

// Create the application window
function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    title: 'EasyCook'
  });

  win.loadFile('index.html'); // the first page to show
}

// Run when Electron has finished starting up
app.whenReady().then(createWindow);

// Quit the app when all windows are closed (Windows/Linux)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});