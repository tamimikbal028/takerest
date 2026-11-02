import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import "@/index.css";
import App from "@/App";
import { registerServiceWorker } from "@/registerServiceWorker";

// Register Service Worker for PWA standalone mode and offline caching
registerServiceWorker();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: { width: "fit-content" },
            duration: 3000,
          }}
        />
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);

