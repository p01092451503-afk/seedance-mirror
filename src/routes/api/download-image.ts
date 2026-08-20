import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/download-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const url = params.get("url");
        const filename = params.get("filename");
        if (!url) return new Response("Missing url.", { status: 400 });
        if (!/^https?:\/\//i.test(url)) return new Response("Invalid url.", { status: 400 });

        const downloadFilename =
          filename && filename.trim() ? filename.replace(/[\\/:*?"<>|]/g, "_") : "0103img_download.png";

        try {
          const upstream = await fetch(url);
          if (!upstream.ok || !upstream.body) {
            return new Response(`Download failed: HTTP ${upstream.status}`, { status: 502 });
          }
          return new Response(upstream.body, {
            headers: {
              "Content-Type": upstream.headers.get("content-type") || "image/png",
              "Content-Disposition": `attachment; filename="${downloadFilename}"`,
            },
          });
        } catch (err) {
          return new Response(`Download failed: ${(err as Error).message}`, { status: 500 });
        }
      },
    },
  },
});
