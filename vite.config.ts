// Import necessary modules
import { defineConfig } from "vite"; // Vite's configuration function
import react from "@vitejs/plugin-react-swc"; // React plugin for Vite with SWC for faster builds
import path from "path"; // Node.js module for handling file paths
import { componentTagger } from "lovable-tagger"; // Custom plugin for tagging React components (optional)

// Export the Vite configuration
export default defineConfig(({ mode }) => ({
  server: {
    host: "::", // Allows the server to be accessible on all IPv6 and IPv4 addresses
    port: 8080, // Port number for the development server
  },
  plugins: [
    react(), // Enables React support in Vite
    mode === "development" && componentTagger(), // Adds the componentTagger plugin only in development mode
  ].filter(Boolean), // Filters out `false` values from the plugins array
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Creates an alias "@" for the "./src" directory for cleaner imports
    },
  },
}));