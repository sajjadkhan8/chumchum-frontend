const GOOGLE_IDENTITY_SCRIPT_ID = 'google-identity-services';
const GOOGLE_IDENTITY_SRC = 'https://accounts.google.com/gsi/client';

interface GoogleCredentialResponse {
  credential?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (listener?: (notification: { isNotDisplayed?: () => boolean; isSkippedMoment?: () => boolean }) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

const loadGoogleIdentityScript = (): Promise<void> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google login is only available in the browser.'));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google login script.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_IDENTITY_SCRIPT_ID;
    script.src = GOOGLE_IDENTITY_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google login script.'));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
};

export const getGoogleIdToken = async (clientId: string): Promise<string> => {
  if (!clientId) {
    throw new Error('Google client id is missing.');
  }

  await loadGoogleIdentityScript();

  return new Promise<string>((resolve, reject) => {
    const googleIdentity = window.google?.accounts?.id;
    if (!googleIdentity) {
      reject(new Error('Google login is not available right now.'));
      return;
    }

    googleIdentity.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) {
          resolve(response.credential);
          return;
        }
        reject(new Error('Google login did not return a credential.'));
      },
      cancel_on_tap_outside: true,
    });

    googleIdentity.prompt((notification) => {
      const notDisplayed = notification.isNotDisplayed?.() ?? false;
      const skipped = notification.isSkippedMoment?.() ?? false;
      if (notDisplayed || skipped) {
        reject(new Error('Google login was cancelled or blocked.'));
      }
    });
  });
};

