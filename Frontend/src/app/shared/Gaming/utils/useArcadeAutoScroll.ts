import { useEffect } from "react";

/**
 * A shared utility hook that automatically scrolls the arcade container into view
 * smoothly when the game mounts/starts.
 */
export const useArcadeAutoScroll = () => {
  useEffect(() => {
    const element = document.getElementById("arcade-container");
    if (element) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, []);
};
