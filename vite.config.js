import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import glsl from "vite-plugin-glsl";

export default defineConfig({
	plugins: [tailwindcss(), glsl()],
	// Vercel serves from the root; GitHub Pages serves from /three-omarchy/.
	base: process.env.VERCEL ? "/" : "/three-omarchy/",
});
