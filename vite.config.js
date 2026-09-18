import { defineConfig } from "vite";
import pkg from "./package.json" assert { type: "json" };

export default defineConfig({
	root: "src",
	base: "/pokedex-master",
	publicDir: "../public",
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version)
	},
	build: {
		outDir: "../dist",
		emptyOutDir: true
	}
});
