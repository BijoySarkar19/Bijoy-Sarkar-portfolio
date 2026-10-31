"use client";

import { useEffect } from "react";

export function CleanCopyHandler() {
  useEffect(() => {
    function handleCopy(e: ClipboardEvent) {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const selectedText = selection.toString();
      // Ensure only plain text is placed on the clipboard so whole links / URLs are not copied
      if (selectedText && e.clipboardData) {
        e.clipboardData.setData("text/plain", selectedText.trim());
        e.preventDefault();
      }
    }

    document.addEventListener("copy", handleCopy);
    return () => document.removeEventListener("copy", handleCopy);
  }, []);

  return null;
}
