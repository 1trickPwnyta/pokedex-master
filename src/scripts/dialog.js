import { Game } from "./game";
import { Graphics } from "./graphics";
import { Sound } from "./sound";
import { UI } from "./ui";
import { Theme } from "./theme";
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

	static choices(title, choices, onSubmit, options) {
		const checkboxes = [];
		const element = document.createElement("div");
		
		if (options.showSelectAll) {
			const buttonArea = document.createElement("div");
			buttonArea.className = "button-area";
			buttonArea.style.marginBottom = "1vh";
			buttonArea.appendChild(UI.makeButtonText("All", () => {
				for (const checkbox of checkboxes) {
					checkbox.checked = true;
				}
			}).element);
			buttonArea.appendChild(UI.makeButtonText("Nothing", () => {
				for (const checkbox of checkboxes) {
					checkbox.checked = false;
				}
			}).element);
			element.appendChild(buttonArea);
		}
		
		for (const choice of choices) {
			const choiceElement = document.createElement("div");
			choiceElement.className = "dialog-checkboxes";
			
			const [ choiceCheckbox, choiceLabel ] = UI.makeCheckbox(choice.value, choice.selected);
			choiceElement.appendChild(choiceCheckbox);
			checkboxes.push(choiceCheckbox);
			choiceElement.appendChild(choiceLabel);
			
			element.appendChild(choiceElement);
		}
		
		const submitButton = UI.makeButtonText("Save", () => {
			const callback = () => onSubmit(checkboxes.filter(c => c.checked).map(c => c.value));
			if (options.requireRestart
					&& choices.map(c => c.selected ? 1 : 0).join("") != checkboxes
						.map(c => c.checked ? 1 : 0).join("")) {
				Dialog.promptRestart(() => Dialog.closeMessage(callback));
			} else {
				Dialog.closeMessage(callback);
			}
		}, true, () => options.minSelections && checkboxes.filter(c => c.checked).length < options.minSelections);
		const cancelButton = UI.makeButtonText("Cancel", () => Dialog.closeMessage(options.onCancel));
		
		Dialog.doDialog({
			title: title,
			element: element,
			buttons: [ submitButton, cancelButton ],
			onCancel: options.onCancel
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
			message: `
				<p>
					So you can name all the Pokémon in national dex order from memory and you think you're real
					smart, huh? But do you know each one's <b>dex number</b>? Can you name them all in random
					order?
				</p>
				<p>
					The path to Pokédex mastery is long and difficult. Do you have what it takes?
				</p>
				<p>
					Questions or comments? Start a discussion on
					<a href="https://github.com/1trickPwnyta/pokedex-master/discussions/new/choose"
					target="_blank">GitHub</a>.
				</p>
			`
		});
	}
	
	static showCredits() {
		Dialog.doDialog({
			title: "Credits",
			message: `
				<p>
					This is an unofficial fan-made project based on Pokémon. Official sprites and Pokémon
					characters are © Nintendo, Creatures Inc., GAME FREAK Inc.
				</p>
				<p>
					<h1>Pokémon sprites</h1>
					<b>Compilation:</b> Caruban<br />
					<b>Gen 1-5 sprites:</b> veekun<br />
					<b>Gen 6-8 sprites:</b> Contributors to Smogon Sprite Project<br />
					<b>Gen 9 sprites:</b> KingOfThe-X-Roads, Mak, Caruban, jinxed, leParagon, Sopita_Yorita,
					Azria, Mashirosakura, JordanosArt, Abnayami, OldSoulja, Katten, Divaruta 666, Clara,
					Skyflyer, AshnixsLaw, ace_stryfe<br />
					<small>Sourced from <a href="https://eeveeexpo.com/resources/1101/" target="_blank">Gen 9
					Resource Pack, Eevee Expo</a></small>
				</p>
				<p>
					<h1>UI icons</h1>
					Most icons used are provided by <a href="https://pictogrammers.com/" target="_blank">
					Pictogrammers</a> from the <a href="https://pictogrammers.com/library/mdi/" target="_blank">
					Material Design Icons</a> library, licensed under the
					<a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank">Apache License 2.0</a>.
				</p>
				<p>
					<h1>Fonts</h1>
					<b>Passion One</b> © 2011 Fontstage (info@fontstage.com), with Reserved Font Name "Passion"<br />
					<b>Press Start 2P</b> © 2012 The Press Start 2P Project Authors (cody@zone38.net), with Reserved Font Name "Press Start 2P"
				</p>
				<p>
					<h1>Programming</h1>
					100% hand-coded and tested by <a href="https://github.com/1trickPwnyta" target="_blank">
					1trickPwnyta</a>. AI used for consulting purposes only.
				</p>
			`
		});
	}

	static showSettings() {
		const element = document.createElement("div");
		element.className = "settings-main";
		
		const top = document.createElement("div");
		top.className = "settings-top";
		element.appendChild(top);
		
		const generationsButton = UI.makeButtonText("Generations", () => {
			const selected = Settings.getGenerations();
			Dialog.choices("Generations", data.generations.map(g => {
				return { value: g.name, selected: selected.includes(g.name) };
			}), selections => {
				Settings.setGenerations(selections);
			}, {
				minSelections: 1,
				requireRestart: true,
				showSelectAll: true
			});
		});
		top.appendChild(generationsButton.element);
		
		const gameplayButton = UI.makeButtonText("Gameplay", () => {
			const gameplay = Settings.getGameplay();
			
			const gameplayElement = document.createElement("div");
			const modeDropdown = UI.makeDropdown("Game mode", [
				Settings.normalMode,
				Settings.reverseMode,
				Settings.blitzMode,
				Settings.orderedMode
			], gameplay.mode);
			gameplayElement.appendChild(modeDropdown.element);
			
			const submitButton = UI.makeButtonText("Save", () => {
				if (gameplay.mode != modeDropdown.value) {
					Dialog.promptRestart(() => {
						Settings.setGameplayMode(modeDropdown.value);
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
		top.appendChild(gameplayButton.element);
		
		const appearanceButton = UI.makeButtonText("Appearance", () => {
			const appearance = Settings.getAppearance();
			const originalAppearance = Settings.getAppearance();
			
			const appearanceElement = document.createElement("div");
			const themeDropdown = UI.makeDropdown("Theme", Theme.getAll(), appearance.theme ?? Theme.default, theme => {
				Theme.apply(theme);
			});
			appearanceElement.appendChild(themeDropdown.element);
			
			const submitButton = UI.makeButtonText("Save", () => {
				Settings.setTheme(themeDropdown.value);
				if (Game.level < 0) {
					Game.reset();
				}
				Dialog.closeMessage();
			});
			const onCancel = () => Theme.apply(originalAppearance.theme ?? Theme.default_theme);
			const cancelButton = UI.makeButtonText("Cancel", () => Dialog.closeMessage(onCancel));
			
			Dialog.doDialog({
				title: "Appearance",
				element: appearanceElement,
				buttons: [ submitButton, cancelButton ],
				onCancel: onCancel
			});
		});
		top.appendChild(appearanceButton.element);
		
		const creditsButton = UI.makeButtonText("Credits", Dialog.showCredits);
		top.appendChild(creditsButton.element);
		
		const bottom = document.createElement("div");
		bottom.className = "settings-bottom";
		const audioButton = UI.makeButtonImage(Settings.isMuteAudio() ? Graphics.soundOff : Graphics.soundOn, () => {
			const muteAudio = !Settings.isMuteAudio();
			Settings.setMuteAudio(muteAudio);
			audioButton.setImage(muteAudio ? Graphics.soundOff : Graphics.soundOn);
			Sound.click.play();
		}, false);
		bottom.appendChild(audioButton.element);
		const helpButton = UI.makeButtonImage(Graphics.helpBox, Dialog.showHelp);
		bottom.appendChild(helpButton.element);
		element.appendChild(bottom);
		
		Dialog.doDialog({
			title: "Menu",
			titleJustification: "center",
			element: element
		});
	}
};
