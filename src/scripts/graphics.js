import data from "../data/data.json";

import IMAGE_ICON from "../graphics/icon.png";
import IMAGE_CHECKBOX_CHECKED from "../graphics/checkbox-marked.png?inline";
import IMAGE_CLOSE_BOX from "../graphics/close-box.png?inline";
import IMAGE_SOUND_ON from "../graphics/volume-high.png?inline";
import IMAGE_SOUND_OFF from "../graphics/volume-off.png?inline";
import IMAGE_DROPDOWN_ARROW from "../graphics/chevron-down.png?inline";
import IMAGE_NO_IMAGE from "../graphics/alert-circle.png?inline";

export class Graphics {
	static icon = IMAGE_ICON;
	static checkboxChecked = IMAGE_CHECKBOX_CHECKED;
	static closeBox = IMAGE_CLOSE_BOX;
	static soundOn = IMAGE_SOUND_ON;
	static soundOff = IMAGE_SOUND_OFF;
	static dropdownArrow = IMAGE_DROPDOWN_ARROW;
	static noImage = IMAGE_NO_IMAGE;
	
	static async init() {
		await Graphics.cacheImage(IMAGE_ICON);
		await Graphics.cacheBackground(IMAGE_NO_IMAGE, null, true);
		await Graphics.cacheBackground(IMAGE_CLOSE_BOX, null, true);
		await Graphics.cacheBackground(IMAGE_CHECKBOX_CHECKED, "--checkbox-checked", true);
		await Graphics.cacheBackground(IMAGE_SOUND_ON, null, true);
		await Graphics.cacheBackground(IMAGE_DROPDOWN_ARROW, "--dropdown-arrow", true);
		await Graphics.cacheBackground(IMAGE_SOUND_OFF, null, true);
	}

	static async cacheImage(url) {
		const image = new Image();
		image.src = url;
		await image.decode();
	}

	static async cacheBackground(url, varName, mask) {
		if (varName) {
			document.documentElement.style.setProperty(varName, `url(${url})`);
		}
		return new Promise(resolve => {
			const image = document.createElement("div");
			if (mask) {
				image.style.maskImage = `url(${url})`;
			} else {
				image.style.backgroundImage = `url(${url})`;
			}
			image.style.position = "fixed";
			image.style.left = "-100vw";
			image.style.top = "-100vw";
			document.body.appendChild(image);
			window.getComputedStyle(image).maskImage;
			window.getComputedStyle(image).backgroundImage;
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					image.remove();
					resolve();
				});
			});
		});
	}
	
	static flushStyle(element) {
		void element.offsetHeight;
	}

	static getSpriteUrl(number, pokemon) {
		for (const sprite_source of data.sprite_sources) {
			if (sprite_source.range[0] <= number && sprite_source.range[1] >= number) {
				return {
					url: `${sprite_source.sprite_prefix}${pokemon.imageId ?? pokemon.name.toLowerCase()}${sprite_source.sprite_suffix}`,
					yoffset: sprite_source.sprite_yoffset
				};
			}
		}
		return { url: Graphics.noImage };
	}
	
	static jitter(element) {
		element.classList.add("jitter");
		setTimeout(() => element.classList.remove("jitter"), 250);
	}
	
	static blink(element) {
		let normalShadow = element.style.boxShadow;
		element.style.boxShadow = "0 0 25px 1.5vh white";
		Graphics.flushStyle(element);
		element.style.transition = "box-shadow 0.5s ease";
		element.style.boxShadow = normalShadow;
		Graphics.flushStyle(element);
		element.style.transition = "";
	}
};
