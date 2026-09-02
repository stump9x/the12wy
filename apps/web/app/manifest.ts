import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "12 Week Year",
    short_name: "12 Week Year",
    description: "Công cụ thực thi mục tiêu theo chu kỳ 12 tuần.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f1e9",
    theme_color: "#254d3c",
    lang: "vi",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
