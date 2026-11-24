"use client";

import { useEffect, useState, useRef } from "react";
import { Check, ShieldAlert } from "lucide-react";

/**
 * Extracts the clean, human-readable name of any button, link, or interactive element,
 * stripping extraneous icons, SVGs, arrow symbols, and decorative glyphs.
 */
function getCleanButtonName(element: HTMLElement): string {
  // 1. Check explicit data-attribute or aria-label first
  const dataName = element.getAttribute("data-button-name");
  if (dataName && dataName.trim()) return dataName.trim();

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();

  // 2. Clone the element and strip all SVGs, images, and aria-hidden decorative icons
  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("svg, img, [aria-hidden='true']").forEach((el) => el.remove());

  let text = clone.textContent || element.innerText || "";

  // 3. Strip arrows, symbols, bullet points, and trailing decorative icons
  text = text
    .replace(/[→↗←↑↓↔✓✔✕✖🔒🔓➕➖•·\u2190-\u21FF]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

  // 4. Fallback if empty
  if (!text) {
    const title = element.getAttribute("title");
    text = (title || element.innerText || "Button").trim();
  }

  return text;
}

export function CleanCopyHandler() {
  const [toast, setToast] = useState<{ message: string; sub?: string } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  function triggerToast(message: string, sub?: string) {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, sub });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 2400);
  }

  useEffect(() => {
    // 1. Intercept standard keyboard copy (Ctrl+C / Cmd+C / Edit Menu Copy)
    function handleCopy(e: ClipboardEvent) {
      const selection = window.getSelection();

      // Case A: User has selected text
      if (selection && !selection.isCollapsed) {
        let text = selection.toString();
        const anchorNode = selection.anchorNode;
        const parentElement =
          anchorNode instanceof HTMLElement ? anchorNode : anchorNode?.parentElement;
        const btn = parentElement?.closest?.(
          'button, a, .button, [role="button"], input[type="button"], input[type="submit"]'
        ) as HTMLElement | null;

        if (btn) {
          // If the selection is inside or around a button/link, strictly copy ONLY the button name
          text = getCleanButtonName(btn);
          triggerToast(`Copied: "${text}"`, "Only button name copied (address blocked)");
        } else {
          // If plain text was selected, ensure any raw URLs/addresses are stripped to plain names
          text = text.replace(/https?:\/\/[^\s]+/gi, (url) => {
            try {
              const parsed = new URL(url);
              return parsed.pathname.split("/").pop() || parsed.hostname;
            } catch {
              return "";
            }
          });
          triggerToast(`Copied text`, "Only plain text copied (no URLs/addresses)");
        }

        if (e.clipboardData) {
          e.clipboardData.setData("text/plain", text.trim());
          e.preventDefault();
        }
        return;
      }

      // Case B: No text selected, but active/focused element is a button or link
      const active = document.activeElement as HTMLElement | null;
      const btn = active?.closest?.(
        'button, a, .button, [role="button"], input[type="button"], input[type="submit"]'
      ) as HTMLElement | null;

      if (btn) {
        const name = getCleanButtonName(btn);
        if (e.clipboardData) {
          e.clipboardData.setData("text/plain", name);
          e.preventDefault();
          triggerToast(`Copied: "${name}"`, "Only button name copied (address blocked)");
        }
      }
    }

    // 2. Intercept right-click (contextmenu) on any button or link to PREVENT "Copy link address"
    function handleContextMenu(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest?.(
        'button, a, .button, [role="button"], input[type="button"], input[type="submit"]'
      ) as HTMLElement | null;

      if (btn) {
        // Block the native context menu containing "Copy link address"
        e.preventDefault();
        const name = getCleanButtonName(btn);

        if (navigator.clipboard?.writeText) {
          navigator.clipboard
            .writeText(name)
            .then(() => {
              triggerToast(`Copied: "${name}"`, "Only button name copied (address blocked)");
            })
            .catch(() => {
              triggerToast(`Button: "${name}"`, "Address copying blocked");
            });
        }
      }
    }

    // 3. Prevent dragging links/buttons into address bars to copy URLs
    function handleDragStart(e: DragEvent) {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest?.('button, a, .button, [role="button"]');
      if (btn) {
        e.preventDefault();
      }
    }

    document.addEventListener("copy", handleCopy);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("dragstart", handleDragStart);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("dragstart", handleDragStart);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  if (!toast) return null;

  return (
    <aside className="clean-copy-toast" role="status" aria-live="polite">
      <div className="clean-copy-toast-inner">
        <span className="clean-copy-badge">
          <Check size={13} />
        </span>
        <div className="clean-copy-text">
          <strong className="clean-copy-title">{toast.message}</strong>
          {toast.sub && <span className="clean-copy-sub">{toast.sub}</span>}
        </div>
      </div>
    </aside>
  );
}
