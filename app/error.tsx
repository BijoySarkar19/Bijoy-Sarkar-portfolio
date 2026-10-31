"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Portfolio route error:", error); }, [error]);
  return <main className="page-message"><div className="page-message-inner"><p className="page-message-code">TEMPORARY SYSTEM ERROR</p><h1>Let&apos;s try<br /><span className="accent">that again.</span></h1><p>The page did not finish loading. Your work is safe; try reloading this view.</p><button className="button" type="button" onClick={reset}>Reload view</button></div></main>;
}
