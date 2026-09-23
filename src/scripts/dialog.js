import { Game } from "./game";
import { Graphics } from "./graphics";
import { Sound } from "./sound";
import { UI } from "./ui";
import { Settings } from "./settings";
import data from "../data/data.json";

const MESSAGE_BACKGROUND = document.getElementById("message-background");

const dialogStack = [];

export class Dialog {
	static doDialog(options) {
		MESSAGE_BACKGROUND.style.visibility = "visible";
		if (dialogStack.length) {
			dialogStack.at(-1).style.display = "none";
		}
		
		let messageBox = document.createElement("div");
		messageBox.className = "message-box card light";
		
		let messageArea = document.createElement("div");
		messageArea.className = "message-area";
		if (options.title) {
			const titleElement = document.createElement("div");
			titleElement.className = "message-title";
			if (options.titleJustification) {
				titleElement.style.textAlign = options.titleJustification;
			}
			titleElement.innerText = options.title;
			messageArea.appendChild(titleElement);
		}
		if (options.subtitle) {
			messageArea.innerHTML += `<div class="message-subtitle">${options.subtitle}</div>`;
		}
		if (options.message) {
			messageArea.innerHTML += `<div class="message-text">${options.message}</div>`;
		}
		if (options.element) {
			options.element.style.width = "100%";
			messageArea.appendChild(options.element);
		}
		messageBox.appendChild(messageArea);
		
		if (options.buttons) {
			let buttonArea = document.createElement("div");
			buttonArea.className = "button-area";
			for (const button of options.buttons) {
				buttonArea.appendChild(button.element);
			}
			messageBox.appendChild(buttonArea);
		}
		
		let messageClose = UI.makeButtonImage(Graphics.closeBox, () => Dialog.closeMessage(options.onCancel));
		messageClose.element.classList.add("message-close");
		messageBox.appendChild(messageClose.element);
		
		MESSAGE_BACKGROUND.appendChild(messageBox);
		dialogStack.push(messageBox);
	}
	
	static promptRestart(callback) {
		if (Game.level >= 0) {
			Dialog.doDialog({
				message: "You've changed settings that require you to restart the game.",
				buttons: [
					UI.makeButtonText("Restart", () => {
						Dialog.closeMessage(callback);
						Game.reset();
					}),
					UI.makeButtonText("Cancel", Dialog.closeMessage)
				]
			});
		} else {
			callback();
			Game.reset();
		}
	}

	static confirm(message, onYes, onNo, onCancel) {
		const yesButton = UI.makeButtonText("Yes", () => Dialog.closeMessage(onYes));
		const noButton = UI.makeButtonText("No", () => Dialog.closeMessage(onNo));
		Dialog.doDialog({ title: message, buttons: [ yesButton, noButton ], onCancel: onCancel });
	}

	static choices(title, choices, onSubmit, onCancel, minSelections, requireRestart) {
		const checkboxes = [];
		
		const element = document.createElement("div");
		for (const choice of choices) {
			const choiceElement = document.createElement("div");
			choiceElement.className = "dialog-checkboxes";
			
			const [ choiceCheckbox, choiceLabel ] = UI.makeCheckbox(
				choice.value,
				choice.selected,
				null,
				checkbox =>
					!minSelections
					|| checkbox.checked
					|| checkboxes.filter(c => c.checked).length >= minSelections
			);
			choiceElement.appendChild(choiceCheckbox);
			checkboxes.push(choiceCheckbox);
			choiceElement.appendChild(choiceLabel);
			
			element.appendChild(choiceElement);
		}
		
		const submitButton = UI.makeButtonText("Save", () => {
			const callback = () => onSubmit(checkboxes.filter(c => c.checked).map(c => c.value));
			if (requireRestart
					&& choices.map(c => c.selected ? 1 : 0).join("") != checkboxes
						.map(c => c.checked ? 1 : 0).join("")) {
				Dialog.promptRestart(() => Dialog.closeMessage(callback));
			} else {
				Dialog.closeMessage(callback);
			}
		});
		const cancelButton = UI.makeButtonText("Cancel", () => Dialog.closeMessage(onCancel));
		
		Dialog.doDialog({
			title: title,
			element: element,
			buttons: [ submitButton, cancelButton ],
			onCancel: onCancel
		});
	}

	static closeMessage(callback = () => {}) {
		MESSAGE_BACKGROUND.removeChild(dialogStack.pop());
		if (dialogStack.length) {
			dialogStack.at(-1).style.display = "flex";
		} else {
			MESSAGE_BACKGROUND.style.visibility = "hidden";
		}
		if (callback) {
			callback();
		}
	}

	static showHelp() {
		Dialog.doDialog({
			title: `Pokédex Master v${__APP_VERSION__}`,
			subtitle: "by 1trickPwnyta",
			message: `<p>So you can name all the Pokémon in dex order from memory and you think you're real smart, huh? But can you name them all <em>by dex number</em> in random order?</p>
	<p>The path to Pokédex mastery is long and difficult. Do you have what it takes?</p>`
		});
	}

	static showSettings() {
		const element = document.createElement("div");
		element.className = "settings-main";
		
		const generationsButton = UI.makeButtonText("Generations", () => {
			const selected = Settings.getGenerations();
			Dialog.choices("Generations", data.generations.map(g => {
				return { value: g.name, selected: selected.includes(g.name) };
			}), selections => {
				Settings.setGenerations(selections);
			}, null, 1, true);
		});
		element.appendChild(generationsButton.element);
		
		const gameplayButton = UI.makeButtonText("Gameplay", () => {
			const gameplay = Settings.getGameplay();
			
			const gameplayElement = document.createElement("div");
			gameplayElement.className = "dialog-checkboxes";
			const [ reverseModeCheckbox, reverseModeLabel ] = UI.makeCheckbox("Reverse mode", gameplay.reverseMode);
			gameplayElement.appendChild(reverseModeCheckbox);
			gameplayElement.appendChild(reverseModeLabel);
			
			const submitButton = UI.makeButtonText("Save", () => {
				if (gameplay.reverseMode != reverseModeCheckbox.checked) {
					Dialog.promptRestart(() => {
						Settings.setReverseMode(reverseModeCheckbox.checked);
						Dialog.closeMessage();
					});
				} else {
					Dialog.closeMessage();
				}
			});
			const cancelButton = UI.makeButtonText("Cancel", Dialog.closeMessage);
			
			Dialog.doDialog({
				title: "Gameplay",
				element: gameplayElement,
				buttons: [ submitButton, cancelButton ]
			});
		});
		element.appendChild(gameplayButton.element);
		
		const bottom = document.createElement("div");
		bottom.className = "settings-bottom";
		const audioButton = UI.makeButtonImage(Settings.isMuteAudio() ? Graphics.soundOff : Graphics.soundOn, () => {
			const muteAudio = !Settings.isMuteAudio();
			Settings.setMuteAudio(muteAudio);
			audioButton.setImage(muteAudio ? Graphics.soundOff : Graphics.soundOn);
			Sound.click.play();
		}, false);
		bottom.appendChild(audioButton.element);
		element.appendChild(bottom);
		
		Dialog.doDialog({
			title: "Options",
			titleJustification: "center",
			element: element
		});
	}
};
