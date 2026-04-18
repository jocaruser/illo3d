import type { Page } from '@playwright/test'

/**
 * Serves a minimal `gapi` + `google.picker` stub so `loadPickerApi` / `openFolderPicker` resolve
 * without loading the real Google Picker bundle.
 */
export async function mockGooglePickerApi(page: Page): Promise<void> {
  // Match optional query string (some environments append cache-busters).
  await page.route(/https:\/\/apis\.google\.com\/js\/api\.js(\?.*)?$/, async (route) => {
    const body = `
      window.gapi = window.gapi || {};
      window.gapi.load = function (api, cb) {
        if (api === 'picker' && typeof cb === 'function') {
          queueMicrotask(cb);
        }
      };
      window.google = window.google || {};
      var PICKED = 'picked';
      window.google.picker = {
        Action: { PICKED: PICKED },
        DocsView: function () {
          return {
            setIncludeFolders: function () { return this; },
            setMimeTypes: function () { return this; },
            setSelectFolderEnabled: function () { return this; },
          };
        },
        PickerBuilder: function () {
          var self = {
            addView: function () { return self; },
            setOAuthToken: function () { return self; },
            setDeveloperKey: function () { return self; },
            setCallback: function (cb) {
              self._cb = cb;
              return self;
            },
            build: function () {
              return {
                setVisible: function (vis) {
                  if (vis && self._cb) {
                    queueMicrotask(function () {
                      self._cb({
                        action: PICKED,
                        docs: [{ id: 'pickedFolder2026', name: 'E2E Picked Folder' }],
                      });
                    });
                  }
                },
              };
            },
          };
          return self;
        },
      };
    `
    await route.fulfill({
      status: 200,
      contentType: 'text/javascript; charset=utf-8',
      body,
    })
  })
}
