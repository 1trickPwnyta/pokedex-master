import themes from "../data/themes.json";

export class Theme {
	static default = themes.default_theme;
	static current = Theme.default;
	
	static getAll() {
		return Object.keys(themes.themes).sort();
	}
	
	static apply(name) {
		const theme = themes.themes[name];
		Theme.current = theme;
		document.documentElement.style.setProperty("--color-dark", theme.color.dark);
		document.documentElement.style.setProperty("--color-medium", theme.color.medium);
		document.documentElement.style.setProperty("--color-light", theme.color.light);
		document.documentElement.style.setProperty("--color-highlight", theme.color.highlight);
		if (theme.css) {
			document.getElementById("theme-css").href = `./themes/${theme.css}`;
		} else {
			document.getElementById("theme-css").href = "";
		}
	}
};
