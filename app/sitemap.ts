import { MetadataRoute } from "next";
import { models } from "@/lib/data/models";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://evolution.kevinbytes.com";

  // Static routes
  const staticRoutes = [
    { url: "", priority: 1.0, changeFrequency: "weekly" as const },
    { url: "/tree", priority: 0.9, changeFrequency: "weekly" as const },
    { url: "/compare", priority: 0.8, changeFrequency: "weekly" as const },
    { url: "/insights", priority: 0.8, changeFrequency: "weekly" as const },
    { url: "/models", priority: 0.8, changeFrequency: "weekly" as const },
    { url: "/papers", priority: 0.8, changeFrequency: "weekly" as const },
    { url: "/timeline", priority: 0.8, changeFrequency: "weekly" as const },
  ].map((route) => ({
    url: `${baseUrl}${route.url}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Dynamic model routes
  const modelRoutes = models.map((model) => {
    // Parse release date for lastModified
    let lastModifiedDate = new Date();
    if (model.releaseDate) {
      const parsed = new Date(model.releaseDate);
      if (!isNaN(parsed.getTime())) {
        lastModifiedDate = parsed;
      }
    }

    return {
      url: `${baseUrl}/models/${model.id}`,
      lastModified: lastModifiedDate,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    };
  });

  return [...staticRoutes, ...modelRoutes];
}
