import { useState, useRef, useEffect, useCallback } from "react";
import type { RefObject, Dispatch, SetStateAction } from "react";

export interface UseDropdownResult {
  isOpen: boolean;
  openUpward: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  triggerRef: RefObject<HTMLButtonElement | null>;
  toggle: () => void;
  close: () => void;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

/**
 * Custom hook to manage dropdown/menu logic:
 * - Toggling open/closed state
 * - Closing on outside click
 * - Viewport-aware positioning (open upwards if not enough space below)
 *
 * @param offset - Minimum space needed below the trigger to open downwards (default: 150)
 */
const useDropdown = (offset: number = 150): UseDropdownResult => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => {
    if (!isOpen && triggerRef.current) {
      // Calculate position before opening
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < offset);
    }
    setIsOpen((prev) => !prev);
  }, [isOpen, offset]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close if clicking outside the menu AND not on the trigger (toggle handles trigger)
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, close]);

  return {
    isOpen,
    openUpward,
    menuRef,
    triggerRef,
    toggle,
    close,
    setIsOpen,
  };
};

const dropdownHooks = {
  useDropdown,
};

export default dropdownHooks;

