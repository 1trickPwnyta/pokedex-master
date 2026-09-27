import themes from "../data/themes.json";

export class Theme {
	static default = themes.default;
	
	static getAll() {
		return Object.keys(themes.themes).sort();
	}
	
	static apply(name) {
		const theme = themes.themes[name];
		document.documentElement.style.setProperty("--color-dark", theme.color.dark);
		document.documentElement.style.setProperty("--color-medium", theme.color.medium);
		document.documentElement.style.setProperty("--color-light", theme.color.light);
		document.documentElement.style.setProperty("--color-highlight", theme.color.highlight);
		document.documentElement.style.setProperty("--font-family", `"${theme.font?.family ?? themes.default_font.family}"`);
		document.documentElement.style.setProperty("--font-size", theme.font?.size ?? themes.default_font.size);
		document.documentElement.style.setProperty("--text-transform", theme.font?.transform ?? "initial");
		document.documentElement.style.setProperty("--filter-image", theme.filter ?? "initial");
		document.documentElement.style.setProperty("--rendering-image", theme.rendering ?? "initial");
		document.documentElement.style.setProperty("--border-radius", theme.border_radius !== false ? "1vh" : "none");
		document.documentElement.style.setProperty("--size-close-button-mask", theme.border_radius !== false ? "102%" : "110%");
	}
};
