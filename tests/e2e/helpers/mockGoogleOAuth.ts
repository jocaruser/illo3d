import type { Page } from '@playwright/test'

export type MockGoogleProfile = {
  email: string
  name: string
  picture?: string
}

const DEFAULT_PROFILE: MockGoogleProfile = {
  email: 'e2e-google@example.com',
  name: 'E2E Google User',
  picture: 'https://www.google.com/favicon.ico',
}

/**
 * Stubs Google Identity Services (`accounts.google.com/gsi/client`) so `useGoogleLogin` receives
 * a token without a real OAuth popup, and stubs `oauth2/v3/userinfo` for the post-login fetch.
 * Call before `page.goto` so the GSI script request is intercepted.
 */
export async function mockGoogleOAuth(
  page: Page,
  profile: MockGoogleProfile = DEFAULT_PROFILE,
): Promise<void> {
  const body = JSON.stringify(profile)

  await page.route(/https:\/\/accounts\.google\.com\/gsi\/client.*/, async (route) => {
    const script = `
      window.google = window.google || {};
      window.google.accounts = window.google.accounts || {};
      window.google.accounts.oauth2 = {
        initTokenClient: function (config) {
          return {
            requestAccessToken: function () {
              if (config && typeof config.callback === 'function') {
                config.callback({
                  access_token: 'e2e-mock-google-access-token',
                  expires_in: 3600,
                });
              }
            },
          };
        },
        initCodeClient: function () {
          return { requestCode: function () {} };
        },
        hasGrantedAllScopes: function () { return true; },
        hasGrantedAnyScope: function () { return true; },
      };
      window.google.accounts.id = window.google.accounts.id || {
        initialize: function () {},
        renderButton: function () {},
        prompt: function () {},
        cancel: function () {},
        disableAutoSelect: function () {},
      };
    `
    await route.fulfill({
      status: 200,
      contentType: 'text/javascript; charset=utf-8',
      body: script,
    })
  })

  await page.route('https://www.googleapis.com/oauth2/v3/userinfo', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body,
    })
  })
}
