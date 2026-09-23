import arrayShuffle from "array-shuffle";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

import data from "../data/data.json";
import pokemon from "../data/pokemon.json";

import IMAGE_ICON from "../graphics/icon.png";
import IMAGE_CLOSE_BOX from "../graphics/close-box.png?inline";
import IMAGE_CHECKBOX_CHECKED from "../graphics/checkbox-marked.png?inline";
import IMAGE_SOUND_ON from "../graphics/volume-high.png?inline";
import IMAGE_SOUND_OFF from "../graphics/volume-off.png?inline";
import IMAGE_NO_IMAGE from "../graphics/alert-circle.png?inline";

const MAIN = document.getElementById("main");
const LOADING = document.getElementById("loading");
const TIMER = document.getElementById("timer");
const QUESTION_TEXT = document.getElementById("question-text");
const QUESTION_IMAGE = document.getElementById("question-image");
const PROGRESS = document.getElementById("progress");
const COLLECTION = document.getElementById("collection-container");
const ANSWER = document.getElementById("answer");
const ANSWER_BOX = document.getElementById("answer-box");
const ANSWER_TEXT = document.getElementById("answer-text");
const ANSWER_FIELD = document.getElementById("answer-field");
const OPTIONS = document.getElementById("options");
const SETTINGS = document.getElementById("settings");
const MESSAGE_BACKGROUND = document.getElementById("message-background");

const OPTION_START = { text: "Start", action: onOptionStart };
const OPTION_GIVEUP = { text: "Give up", action: onOptionGiveUp };
const OPTION_RESTART = { text: "Restart", action: onOptionRestart };
const OPTION_HELP = { image: new URL("../graphics/help-box.png", import.meta.url).href, action: onOptionHelp };
const OPTION_SETTINGS = { image: new URL("../graphics/cog-box.png", import.meta.url).href, action: onOptionSettings };

const SOUND_CLICK = loadAudio(new URL("../audio/click.wav", import.meta.url).href);
const SOUND_REJECT = loadAudio(new URL("../audio/reject.wav", import.meta.url).href);
const SOUND_GIVEUP = loadAudio(new URL("../audio/giveup.wav", import.meta.url).href);
const SOUND_WIN = loadAudio(new URL("../audio/win.wav", import.meta.url).href);

let muteAudio = localStorage.pokedex_master_muteAudio ? JSON.parse(localStorage.pokedex_master_muteAudio) : false;

let level = -1;
let board;
let startTime;
let timerUpdate;

const options = [];
addOption(OPTION_START);

const dialogStack = [];

addSetting(OPTION_HELP);
addSetting(OPTION_SETTINGS);

await cacheImage(IMAGE_ICON);
await cacheBackground(IMAGE_NO_IMAGE, null, true);
await cacheBackground(IMAGE_CLOSE_BOX, null, true);
await cacheBackground(IMAGE_CHECKBOX_CHECKED, "--checkbox-checked", true);
await cacheBackground(IMAGE_SOUND_ON, null, true);
await cacheBackground(IMAGE_SOUND_OFF, null, true);

if (!localStorage.pokedex_master_generations || !JSON.parse(localStorage.pokedex_master_generations).length) {
	localStorage.pokedex_master_generations = localStorage.generations ?? JSON.stringify([ data.generations[0].name ]);
}
if (!localStorage.pokedex_master_gameplay) {
	localStorage.pokedex_master_gameplay = JSON.stringify({});
}

MAIN.style.visibility = "visible";
LOADING.style.opacity = "0";
setTimeout(() => document.body.removeChild(LOADING), 1000);

buildBoard();

function flushStyle(element) {
	void element.offsetHeight;
}

async function cacheImage(url) {
	const image = new Image();
	image.src = url;
	await image.decode();
}

async function cacheBackground(url, varName, mask) {
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

function loadAudio(url) {
	const audio = new Audio(url);
	return {
		play: () => {
			if (!muteAudio) audio.play();
		}
	};
}

function jitter(element) {
	element.classList.add("jitter");
	setTimeout(() => element.classList.remove("jitter"), 250);
}

function getSpriteUrl(number, pokemon) {
	for (const generation of data.generations) {
		if (generation.range[0] <= number && generation.range[1] >= number) {
			return `${generation.sprite_prefix}${pokemon.imageId ?? pokemon.name.toLowerCase()}${generation.sprite_suffix}`;
		}
	}
	return IMAGE_NO_IMAGE;
}

function getPokemon(number) {
	return pokemon[number - 1];
}

function getCurrentPokemon() {
	return pokemon[board[level] - 1];
}

function makeButton(text, image, action, playClickSound = true) {
	let button = document.createElement("div");
	button.className = "option";
	button.innerText = text ?? "";
	if (image) {
		const icon = document.createElement("div");
		icon.style.maskImage = `url('${image}')`;
		button.appendChild(icon);
		button.setImage = url => {
			icon.style.maskImage = `url('${url}')`;
		};
	}
	button.onclick = () => {
		if (playClickSound) {
			SOUND_CLICK.play();
		}
		action();
	};
	return button;
}

function addOption(opt) {
	const option = makeButton(opt.text, opt.image, opt.action);
	opt.option = option;
	OPTIONS.appendChild(option);
	options.push(opt);
}

function removeOption(opt) {
	const option = options.find(o => o.text == opt.text);
	if (option) {
		OPTIONS.removeChild(option.option);
		options.splice(options.indexOf(option), 1);
	}
}

function removeAllOptions() {
	while (options.length) {
		removeOption(options[0]);
	}
}

function addSetting(set) {
	const setting = makeButton(set.text, set.image, set.action);
	SETTINGS.appendChild(setting);
}

function simplifyName(name) {
	return name.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
}

function getReverseMode() {
	return JSON.parse(localStorage.pokedex_master_gameplay).reverseMode ?? false;
}

function onAnswerInput() {
	const answer = !getReverseMode() ? board[level] : simplifyName(getCurrentPokemon().name);
	if (simplifyName(ANSWER_FIELD.value) == answer) {
		ANSWER_FIELD.value = "";
		blinkAnswerField();
		nextLevel();
	}
}

function onOptionStart() {
	startGame();
}

function onOptionGiveUp() {
	confirm("You really want to give up?", () => {
		SOUND_GIVEUP.play();
		if (!getReverseMode()) {
			setQuestion(`${getCurrentPokemon().name} is`, board[level], null, "giveup-x", "giveup-y");
		} else {
			setQuestion(`${board[level]} is ${getCurrentPokemon().name}!`, null, getSpriteUrl(board[level], getCurrentPokemon()), "giveup-x", "giveup-y");
		}
		stopGame();
	});
}

function onOptionRestart() {
	restartGame();
}

function onOptionHelp() {
	showHelp();
}

function onOptionSettings() {
	showSettings();
}

function updateTimer() {
	const milliseconds = new Date() - startTime;
	const duration = dayjs.duration(milliseconds);
	const minutes = Math.floor(duration.asMinutes());
	const seconds = duration.seconds();
	TIMER.innerText = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function updateProgress() {
	const progress = `${level}<br />/ ${board.length}`;
	PROGRESS.innerHTML = progress;
}

function collect() {
	SOUND_CLICK.play();
	
	const existing = Array.from(COLLECTION.getElementsByClassName("collected"));
	const first = existing.length > 0 ? existing[0] : null;
	const preY = first?.getBoundingClientRect().top;
	const collected = document.createElement("div");
	collected.className = "collected card";
	collected.style.opacity = "0";
	collected.style.backgroundImage = `url('${getSpriteUrl(board[level], getCurrentPokemon())}')`;
	collected.innerHTML = `<div class="collected-number"><span class="small-symbol">#</span>${board[level]}</div>`;
	COLLECTION.prepend(collected);
	COLLECTION.scrollTop = 0;
	flushStyle(collected);
	collected.style.opacity = "1";
	const postY = first?.getBoundingClientRect().top;
	
	if (first) {
		const delta = postY - preY;
		for (const element of existing) {
			element.animate([
				{ transform: `translateY(${-delta}px)` },
				{ transform: `translateY(0)` }
			], {
				duration: 125,
				easing: "ease-out"
			});
		}
	}
}

function clearCollection() {
	COLLECTION.innerHTML = "";
}

function startGame() {
	removeAllOptions();
	addOption(OPTION_GIVEUP);
	ANSWER_FIELD.type = !getReverseMode() ? "number" : "text";
	ANSWER_TEXT.innerText = !getReverseMode() ? "What number is it?" : "Which Pokémon is it?";
	if (!board || !board.length) {
		buildBoard();
	}
	level = -1;
	showAnswerBox();
	clearCollection();
	nextLevel();
	startTime = new Date();
	updateTimer();
	timerUpdate = setInterval(updateTimer, 1000);
}

function restartGame() {
	startGame();
}

function resetGame() {
	stopGame();
	removeAllOptions();
	addOption(OPTION_START);
	setQuestion("Welcome to<br />Pokédex Master", null, IMAGE_ICON);
	clearCollection();
	TIMER.innerHTML = "";
	PROGRESS.innerHTML = "";
	level = -1;
}

function stopGame() {
	removeAllOptions();
	addOption(OPTION_RESTART);
	hideAnswerBox();
	if (timerUpdate) {
		clearInterval(timerUpdate);
		timerUpdate = null;
	}
	level = -1;
	buildBoard();
}

function win() {
	SOUND_WIN.play();
	stopGame();
	const generations = JSON.parse(localStorage.pokedex_master_generations);
	let winCount = board.length;
	if (generations.length == 1) {
		winCount = `every ${generations[0]}`;
	} else if (generations.length == 9) {
		winCount = "every";
	}
	setQuestion(`Good job!<br />You ${!getReverseMode() ? "numbered" : "named"} ${winCount} Pokémon in ${TIMER.innerText}.`);
}

function buildBoard() {
	const generations = JSON.parse(localStorage.pokedex_master_generations);
	board = [];
	for (const generation of data.generations.filter(g => generations.includes(g.name))) {
		board = [ ...board, ...Array.from({ length: generation.range[1] - generation.range[0] + 1 }, (_, i) =>  generation.range[0] + i) ];
	}
	board = arrayShuffle(board);
	const url = getSpriteUrl(board[0], getPokemon(board[0]));
	cacheImage(url);
	cacheBackground(url);
}

function nextLevel() {
	if (level > -1) {
		collect();
	}
	level++;
	updateProgress();
	
	if (level < board.length) {
		const currentPokemon = getCurrentPokemon();
		const url = getSpriteUrl(board[level], currentPokemon);
		if (getReverseMode()) {
			setQuestion("", board[level]);
			cacheImage(url);
			cacheBackground(url);
		} else {
			setQuestion(currentPokemon.name, null, url);
			if (level < board.length - 1) {
				const nextUrl = getSpriteUrl(board[level + 1], getPokemon(board[level + 1]));
				cacheImage(nextUrl);
				cacheBackground(nextUrl);
			}
		}
	} else {
		win();
	}
}

function setQuestion(text, number, image, outerClass, innerClass) {
	clearQuestion();
	QUESTION_TEXT.innerHTML = text;
	if (number) {
		let questionNumber = document.createElement("div");
		questionNumber.className = `question-number ${outerClass}`;
		questionNumber.innerHTML = `<div class="${innerClass ?? ""}">${number}</div>`;
		QUESTION_TEXT.appendChild(questionNumber);
	}
	QUESTION_IMAGE.className = "";
	if (image) {
		QUESTION_IMAGE.style.display = "initial";
		QUESTION_IMAGE.className = outerClass ?? "";
		QUESTION_IMAGE.innerHTML = `<img src="${image}" class="${innerClass ?? ""}" />`;
	}
}

function clearQuestion() {
	QUESTION_TEXT.innerHTML = "";
	QUESTION_IMAGE.innerHTML = "";
	QUESTION_IMAGE.style.display = "none";
}

function showAnswerBox() {
	ANSWER_BOX.style.visibility = "visible";
	ANSWER_FIELD.focus();
}

function hideAnswerBox() {
	ANSWER_BOX.style.visibility = "hidden";
}

function blinkAnswerField() {
	let normalShadow = ANSWER_FIELD.style.boxShadow;
	ANSWER_FIELD.style.boxShadow = "0 0 25px 1.5vh white";
	flushStyle(ANSWER_FIELD);
	ANSWER_FIELD.style.transition = "box-shadow 0.5s ease";
	ANSWER_FIELD.style.boxShadow = normalShadow;
	flushStyle(ANSWER_FIELD);
	ANSWER_FIELD.style.transition = "";
}

function promptRestart(callback) {
	if (level >= 0) {
		doDialog({
			message: "You've changed settings that require you to restart the game.",
			buttons: [
				makeButton("Restart", null, () => {
					closeMessage(callback);
					resetGame();
				}),
				makeButton("Cancel", null, closeMessage)
			]
		});
	} else {
		callback();
		resetGame();
	}
}

function doDialog(options) {
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
			buttonArea.appendChild(button);
		}
		messageBox.appendChild(buttonArea);
	}
	
	let messageClose = makeButton("", IMAGE_CLOSE_BOX, () => closeMessage(options.onCancel));
	messageClose.classList.add("message-close");
	messageBox.appendChild(messageClose);
	
	MESSAGE_BACKGROUND.appendChild(messageBox);
	dialogStack.push(messageBox);
}

function confirm(message, onYes, onNo, onCancel) {
	const yesButton = makeButton("Yes", null, () => closeMessage(onYes));
	const noButton = makeButton("No", null, () => closeMessage(onNo));
	doDialog({ title: message, buttons: [ yesButton, noButton ], onCancel: onCancel });
}

function makeCheckbox(value, checked, onclick, validate) {
	const checkbox = document.createElement("input");
	
	const clickAction = () => {
		if (validate) {
			if (!validate(checkbox)) {
				checkbox.checked = !checkbox.checked;
				SOUND_REJECT.play();
				jitter(checkbox);
				return;
			}
		}
		if (onclick) {
			onclick(checkbox);
		}
		SOUND_CLICK.play();
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

function choices(title, choices, onSubmit, onCancel, minSelections, requireRestart) {
	const checkboxes = [];
	
	const element = document.createElement("div");
	for (const choice of choices) {
		const choiceElement = document.createElement("div");
		choiceElement.className = "dialog-checkboxes";
		
		const [ choiceCheckbox, choiceLabel ] = makeCheckbox(
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
	
	const submitButton = makeButton("Save", null, () => {
		const callback = () => onSubmit(checkboxes.filter(c => c.checked).map(c => c.value));
		if (requireRestart && !choices
				.filter(c => c.selected)
				.map(c => c.value)
				.every((v, i) => v === checkboxes
						.filter(c => c.checked)
						.map(c => c.value)[i])) {
			promptRestart(() => closeMessage(callback));
		} else {
			closeMessage(callback);
		}
	});
	const cancelButton = makeButton("Cancel", null, () => closeMessage(onCancel));
	
	doDialog({
		title: title,
		element: element,
		buttons: [ submitButton, cancelButton ],
		onCancel: onCancel
	});
}

function closeMessage(callback = () => {}) {
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

function showHelp() {
	doDialog({
		title: `Pokédex Master v${__APP_VERSION__}`,
		subtitle: "by 1trickPwnyta",
		message: `<p>So you can name all the Pokémon in dex order from memory and you think you're real smart, huh? But can you name them all <em>by dex number</em> in random order?</p>
<p>The path to Pokédex mastery is long and difficult. Do you have what it takes?</p>`
	});
}

function showSettings() {
	const element = document.createElement("div");
	element.className = "settings-main";
	
	const generationsButton = makeButton("Generations", null, () => {
		const selected = JSON.parse(localStorage.pokedex_master_generations);
		choices("Generations", data.generations.map(g => {
			return { value: g.name, selected: selected.includes(g.name) };
		}), selections => {
			localStorage.pokedex_master_generations = JSON.stringify(selections);
		}, null, 1, true);
	});
	element.appendChild(generationsButton);
	
	const gameplayButton = makeButton("Gameplay", null, () => {
		const gameplay = JSON.parse(localStorage.pokedex_master_gameplay);
		
		const gameplayElement = document.createElement("div");
		gameplayElement.className = "dialog-checkboxes";
		const [ reverseModeCheckbox, reverseModeLabel ] = makeCheckbox("Reverse mode", gameplay.reverseMode);
		gameplayElement.appendChild(reverseModeCheckbox);
		gameplayElement.appendChild(reverseModeLabel);
		
		const submitButton = makeButton("Save", null, () => {
			if (gameplay.reverseMode != reverseModeCheckbox.checked) {
				promptRestart(() => {
					gameplay.reverseMode = reverseModeCheckbox.checked;
					localStorage.pokedex_master_gameplay = JSON.stringify(gameplay);
					closeMessage();
				});
			} else {
				closeMessage();
			}
		});
		const cancelButton = makeButton("Cancel", null, closeMessage);
		
		doDialog({
			title: "Gameplay",
			element: gameplayElement,
			buttons: [ submitButton, cancelButton ]
		});
	});
	element.appendChild(gameplayButton);
	
	const bottom = document.createElement("div");
	bottom.className = "settings-bottom";
	const audioButton = makeButton("", muteAudio ? IMAGE_SOUND_OFF : IMAGE_SOUND_ON, () => {
		muteAudio = !muteAudio;
		localStorage.pokedex_master_muteAudio = muteAudio;
		audioButton.setImage(muteAudio ? IMAGE_SOUND_OFF : IMAGE_SOUND_ON);
		SOUND_CLICK.play();
	}, false);
	bottom.appendChild(audioButton);
	element.appendChild(bottom);
	
	doDialog({
		title: "Options",
		titleJustification: "center",
		element: element
	});
}

window.onAnswerInput = onAnswerInput;