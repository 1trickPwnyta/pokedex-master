import { Graphics } from "./graphics";
import { Sound } from "./sound";

export class Button {
	text;
	element;
	
	constructor(options) {
		this.element = document.createElement("div");
		this.element.className = "option";
		if (options.text) {
			this.text = options.text;
			this.element.innerText = this.text;
		}
		if (options.image) {
			this.element.icon = document.createElement("div");
			this.element.icon.style.maskImage = `url('${options.image}')`;
			this.element.appendChild(this.element.icon);
		}
		this.element.onclick = () => {
			if (!options.silent) {
				Sound.click.play();
			}
			if (options.action) {
				options.action();
			}
		};
	}
	
	setImage(url) {
		if (this.element.icon) {
			this.element.icon.style.maskImage = `url('${url}')`;
		} else {
			console.error("Can't set image for non-image button. Create button with image first.");
		}
	}
}

export class UI {
	static makeButtonText(text, action, playClickSound = true) {
		return new Button({
			text: text,
			action: action,
			silent: !playClickSound
		});
	}
	
	static makeButtonImage(image, action, playClickSound = true) {
		return new Button({
			image: image,
			action: action,
			silent: !playClickSound
		});
	}
	
	static makeCheckbox(value, checked, onclick, validate) {
		const checkbox = document.createElement("input");
		
		const clickAction = () => {
			if (validate) {
				if (!validate(checkbox)) {
					checkbox.checked = !checkbox.checked;
					Sound.reject.play();
					Graphics.jitter(checkbox);
					return;
				}
			}
			if (onclick) {
				onclick(checkbox);
			}
			Sound.click.play();
		};
		
		checkbox.type = "checkbox";
		checkbox.value = value;
		checkbox.onclick = clickAction;
		checkbox.checked = checked;
		checkbox.style.cursor = "pointer";
		
		const label = document.createElement("label");
		label.innerText = value;
		label.onclick = () => {
			checkbox.checked = !checkbox.checked;
			clickAction();
		};
		label.style.cursor = "pointer";
		
		return [ checkbox, label ];
	}
};
