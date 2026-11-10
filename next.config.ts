import type { NextConfig } from "next";

// Extra dev origins (e.g. a LAN IP for testing from another device) come from
// ALLOWED_DEV_ORIGINS in .env.local, comma-separated, so no machine-specific
// address is committed. Example: ALLOWED_DEV_ORIGINS=192.168.1.20
const extraDevOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", ...extraDevOrigins],
};

export default nextConfig;
