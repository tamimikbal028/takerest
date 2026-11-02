/**
 * Take Rest PWA Service Worker Registration
 * Handles registration, lifecycle monitoring, and seamless update detection.
 */

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        // Successfully registered
        console.log(
          "[Take Rest PWA] Service Worker registered successfully with scope:",
          registration.scope
        );

        // Check for updates when the user returns to the app
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            registration.update().catch((err) => {
              console.debug("[Take Rest PWA] Update check failed:", err);
            });
          }
        });

        // Listen for new service worker installation
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log(
                "[Take Rest PWA] New update available. App will refresh on next launch."
              );
            }
          });
        });
      })
      .catch((error) => {
        console.error(
          "[Take Rest PWA] Service Worker registration failed:",
          error
        );
      });
  });
}
