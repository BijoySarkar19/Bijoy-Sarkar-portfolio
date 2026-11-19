import NotFound from "@/app/not-found";

export const metadata = {
  title: "404 · Repository or Page Not Found — Bijoy Sarkar",
  description: "The requested GitHub repository or project link is under active development and not yet publicly available.",
};

export default function Custom404Route() {
  return <NotFound />;
}
