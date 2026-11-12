"use client";

import { useEffect, useState } from "react";

export function DynamicCopyright() {
  const [year, setYear] = useState<number>(() => new Date().getFullYear());

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    if (currentYear !== year) {
      setYear(currentYear);
    }
  }, [year]);

  return <span suppressHydrationWarning>© {year} Bijoy Sarkar. All rights reserved.</span>;
}
