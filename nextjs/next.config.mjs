/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the core package and the native embedding runtime out of the webpack
  // bundle — they're server-only and load via Node's require/import at runtime.
  experimental: {
    serverComponentsExternalPackages: ["@kg/core", "@xenova/transformers", "onnxruntime-node", "sharp", "pdf-parse", "mammoth"],
  },
};

export default nextConfig;
