export interface DegreeItem {
  id: string;
  degree: string;
  institution: string;
  link: string;
  period: string;
  showOnHome: boolean;
}

export const DEFAULT_DEGREES: DegreeItem[] = [
  {
    id: "btech-degree",
    degree: "B.Tech · Computer Science & Engineering",
    institution: "ICFAI University Tripura",
    link: "https://www.iutripura.edu.in/",
    period: "2023 - 2027",
    showOnHome: true,
  },
];

export function parseDegrees(raw?: string | null): DegreeItem[] {
  if (!raw) return DEFAULT_DEGREES;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item, idx) => ({
        id: String(item.id || `degree-${idx}`),
        degree: String(item.degree || "Degree"),
        institution: String(item.institution || "Institution"),
        link: String(item.link || "https://"),
        period: String(item.period || ""),
        showOnHome: item.showOnHome !== false,
      }));
    }
  } catch (e) {
    console.error("Failed to parse degrees JSON:", e);
  }
  return DEFAULT_DEGREES;
}
