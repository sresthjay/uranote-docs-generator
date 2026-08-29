import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Uranote Operations",
    short_name: "Uranote Docs",
    description: "Uranote Operations & Booking Management",
    start_url: "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#2563eb",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}