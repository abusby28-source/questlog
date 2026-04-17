const { app, BrowserWindow, session, protocol, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

app.disableHardwareAcceleration();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: 'rgba(10, 10, 10, 0)',
      symbolColor: '#ffffff',
      height: 36,
    }
  });

  // Disable CSP that blocks local resources in Electron
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src * 'unsafe-inline' 'unsafe-eval' data: blob:"]
      }
    });
  });

  const serverUrl = 'http://localhost:3000';
  
  const loadURL = () => {
    mainWindow.loadURL(serverUrl).catch(() => {
      setTimeout(loadURL, 1000);
    });
  };
  
  loadURL();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Intercept nucleus: protocol used by EA OAuth redirect
  protocol.registerStringProtocol('nucleus', (request, callback) => {
    try {
      const url = request.url;
      const hashIndex = url.indexOf('#');
      const queryIndex = url.indexOf('?');
      const paramStr = hashIndex !== -1 ? url.slice(hashIndex + 1)
                     : queryIndex !== -1 ? url.slice(queryIndex + 1) : '';
      const params = new URLSearchParams(paramStr);
      const access_token = params.get('access_token');
      if (access_token && mainWindow) {
        mainWindow.webContents.executeJavaScript(
          `if (window.__handleEAAuthToken) window.__handleEAAuthToken(${JSON.stringify(access_token)})`
        ).catch(() => {});
      }
    } catch (e) {
      console.error('EA auth protocol error:', e);
    }
    callback({ mimeType: 'text/html', data: '<html><body style="font-family:sans-serif;padding:20px;background:#0a0a0a;color:#fff"><p>EA authentication complete. You may close this window.</p></body></html>' });
  });

  // Epic Games OAuth via IPC — opens a BrowserWindow, captures exchange code from redirect flow.
  // Uses /id/login?redirectUrl= (Legendary/Heroic-style).
  // Clears stale Epic cookies first so we always get a fresh exchange code.
  // Open a URL in the system default browser (not inside Electron)
  const { shell } = require('electron');
  ipcMain.handle('open-external', (_event, url) => {
    shell.openExternal(url);
  });

  ipcMain.handle('epic-oauth', async () => {
    // Clear stale Epic session cookies to ensure a fresh exchange code
    try {
      const cookies = await session.defaultSession.cookies.get({ domain: 'epicgames.com' });
      for (const cookie of cookies) {
        const url = `https://${cookie.domain.replace(/^\./, '')}${cookie.path}`;
        await session.defaultSession.cookies.remove(url, cookie.name);
      }
    } catch {}

    return new Promise((resolve, reject) => {
      let resolved = false;
      const tryResolve = (code) => {
        if (resolved || !code || code === 'error') return;
        resolved = true;
        try { authWindow.destroy(); } catch {}
        resolve(code);
      };

      const authWindow = new BrowserWindow({
        width: 600,
        height: 700,
        webPreferences: { nodeIntegration: false, contextIsolation: true },
        autoHideMenuBar: true,
      });

      const EPIC_CLIENT_ID = '34a02cf8f4414e29b15921876da36f9a';
      const EPIC_REDIRECT = 'https://www.epicgames.com/id/api/redirect';
      const redirectUrl = `${EPIC_REDIRECT}?clientId=${EPIC_CLIENT_ID}&responseType=code`;
      const authUrl = `https://www.epicgames.com/id/login?redirectUrl=${encodeURIComponent(redirectUrl)}`;
      authWindow.loadURL(authUrl);

      // Only capture code when we reach the EPIC_REDIRECT endpoint — not from intermediate URLs
      authWindow.webContents.on('will-redirect', (_e, url) => {
        if (!url.startsWith(EPIC_REDIRECT)) return;
        try {
          const params = new URL(url).searchParams;
          const code = params.get('authorizationCode') || params.get('code');
          tryResolve(code);
        } catch {}
      });

      // Read the JSON body once the redirect page finishes loading
      authWindow.webContents.on('did-finish-load', async () => {
        if (resolved) return;
        const url = authWindow.webContents.getURL();
        if (!url.startsWith(EPIC_REDIRECT)) return;
        try {
          const body = await authWindow.webContents.executeJavaScript('document.body.innerText');
          const data = JSON.parse(body);
          tryResolve(data.authorizationCode);
        } catch {}
      });

      authWindow.on('closed', () => {
        if (!resolved) reject(new Error('Auth window closed'));
      });
    });
  });

  const isDev = !app.isPackaged;
  
  if (isDev) {
    console.log('Running in development mode. Make sure npm run dev is running.');
  } else {
    // In production, start the built server
    const serverPath = path.join(process.resourcesPath, 'app', 'dist', 'server.js');
    const userDataPath = app.getPath('userData');
    serverProcess = spawn(process.execPath, [serverPath], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', NODE_ENV: 'production', DATA_DIR: userDataPath }
    });
    
    serverProcess.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });
  }

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
