import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // ssh2 (через dockerode → docker-modem) содержит native Node.js модули,
  // которые Turbopack не может бандлить в ESM. Помечаем как serverExternal.
  serverExternalPackages: ["ssh2", "dockerode", "docker-modem", "pino", "pino-pretty"],
};

export default nextConfig;
