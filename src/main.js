import arrayShuffle from "array-shuffle";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);
import meta from "./meta.json";
import data from "./data.json";
import pokemon from "./pokemon.json";

const MAIN = document.getElementById("main");
const TIMER = document.getElementById("timer");
const QUESTION_TEXT = document.getElementById("question-text");
const QUESTION_IMAGE = document.getElementById("question-image");
const PROGRESS = document.getElementById("progress");
const COLLECTION = document.getElementById("collection-container");
const ANSWER = document.getElementById("answer");
const ANSWER_BOX = document.getElementById("answer-box");
const ANSWER_FIELD = document.getElementById("answer-field");
const OPTIONS = document.getElementById("options");
const SETTINGS = document.getElementById("settings");
const MESSAGE_BACKGROUND = document.getElementById("message-background");

const OPTION_START = { text: "Start", action: onOptionStart };
const OPTION_GIVEUP = { text: "Give up", action: onOptionGiveUp };
const OPTION_RESTART = { text: "Restart", action: onOptionRestart };
const OPTION_HELP = { image: new URL("./help-box.png", import.meta.url).href, action: onOptionHelp };
const OPTION_SETTINGS = { image: new URL("./cog-box.png", import.meta.url).href, action: onOptionSettings };

const SOUND_CLICK = new Audio("./click.wav");
const SOUND_REJECT = new Audio("./reject.wav");
const SOUND_GIVEUP = new Audio("./giveup.wav");
const SOUND_WIN = new Audio("./win.wav");

let level;
let board;
let startTime;
let timerUpdate;

const options = [];
addOption(OPTION_START);

const dialogStack = [];

addSetting(OPTION_HELP);
addSetting(OPTION_SETTINGS);

await cacheImage("./alert-circle.png");
await cacheImage("./checkbox-marked.png");
await cacheImage("./close-box.png");

if (!localStorage.generations || !JSON.parse(localStorage.generations).length) {
	localStorage.generations = JSON.stringify([ data.generations[0].name ]);
}

function flushStyle(element) {
	void element.offsetHeight;
}

async function cacheImage(url) {
	const image = new Image();
	image.fetchPriority = "high";
	image.src = url;
	await image.decode();
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
	return "./alert-circle.png";
}

function getCurrentPokemon() {
	return pokemon[board[level] - 1];
}

function makeButton(text, image, action) {
	let button = document.createElement("div");
	button.className = "option";
	button.innerText = text ?? "";
	if (image) {
		const icon = document.createElement("div");
		icon.style.maskImage = `url('${image}')`;
		button.appendChild(icon);
	}
	button.onclick = () => {
		SOUND_CLICK.play();
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

function onAnswerInput() {
	if (simplifyName(ANSWER_FIELD.value) == simplifyName(getCurrentPokemon().name)) {
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
		stopGame();
		setQuestion(`It was ${getCurrentPokemon().name}!`, 0, getSpriteUrl(board[level], getCurrentPokemon()), "giveup-x", "giveup-y");
	});
}

function onOptionRestart() {
	startGame();
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
	buildBoard();
	level = -1;
	showAnswerBox();
	clearCollection();
	nextLevel();
	startTime = new Date();
	updateTimer();
	timerUpdate = setInterval(updateTimer, 1000);
}

function stopGame() {
	removeAllOptions();
	addOption(OPTION_RESTART);
	hideAnswerBox();
	if (timerUpdate) {
		clearInterval(timerUpdate);
		timerUpdate = null;
	}
}

function win() {
	SOUND_WIN.play();
	stopGame();
	setQuestion(`Good job!<br />You named ${board.length} Pokémon in ${TIMER.innerText}.`);
}

function buildBoard() {
	const generations = JSON.parse(localStorage.generations);
	board = [];
	for (const generation of data.generations.filter(g => generations.includes(g.name))) {
		board = [ ...board, ...Array.from({ length: generation.range[1] - generation.range[0] + 1 }, (_, i) =>  generation.range[0] + i) ];
	}
	board = arrayShuffle(board);
}

function nextLevel() {
	if (level > -1) {
		collect();
	}
	level++;
	updateProgress();
	
	if (level < board.length) {
		setQuestion("", board[level]);
		cacheImage(getSpriteUrl(board[level], getCurrentPokemon()));
	} else {
		win();
	}
}

function setQuestion(text, number, image, outerImageClass, innerImageClass) {
	clearQuestion();
	QUESTION_TEXT.innerHTML = text;
	if (number) {
		let questionNumber = document.createElement("div");
		questionNumber.className = "question-number";
		questionNumber.innerText = number;
		QUESTION_TEXT.appendChild(questionNumber);
	}
	QUESTION_IMAGE.className = "";
	if (image) {
		QUESTION_IMAGE.style.display = "initial";
		QUESTION_IMAGE.className = outerImageClass ?? "";
		QUESTION_IMAGE.innerHTML = `<img src="${image}" class="${innerImageClass ?? ""}" />`;
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
	
	let messageClose = makeButton("", new URL("./close-box.png", import.meta.url).href, () => closeMessage(options.onCancel));
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

function choices(title, choices, onSubmit, onCancel, minSelections) {
	const checkboxes = [];
	
	const element = document.createElement("div");
	for (const choice of choices) {
		const choiceElement = document.createElement("div");
		choiceElement.className = "dialog-choice";
		
		const click = () => {
			if (minSelections
				&& choiceCheckbox.checked
				&& checkboxes.filter(c => c.checked).length <= minSelections) {
				SOUND_REJECT.play();
				jitter(choiceCheckbox);
			} else {
				SOUND_CLICK.play();
				choiceCheckbox.checked = !choiceCheckbox.checked;
			}
		};
		
		const choiceCheckbox = document.createElement("input");
		choiceCheckbox.type = "checkbox";
		choiceCheckbox.value = choice.value;
		choiceCheckbox.id = `choices-${choice.value}`;
		choiceCheckbox.onclick = e => {
			choiceCheckbox.checked = !choiceCheckbox.checked;
			click();
		};
		choiceCheckbox.checked = choice.selected;
		choiceElement.appendChild(choiceCheckbox);
		checkboxes.push(choiceCheckbox);
		
		const choiceLabel = document.createElement("label");
		choiceLabel.for = choiceCheckbox.id;
		choiceLabel.innerText = choice.value;
		choiceLabel.onclick = click;
		choiceElement.appendChild(choiceLabel);
		
		element.appendChild(choiceElement);
	}
	
	const submitButton = makeButton("Save", null, () => closeMessage(() => {
		onSubmit(checkboxes.filter(c => c.checked).map(c => c.value));
	}));
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
	
	const generationsButton = makeButton("Generations", null, () => {
		const selected = JSON.parse(localStorage.generations);
		choices("Generations", data.generations.map(g => {
			return { value: g.name, selected: selected.includes(g.name) };
		}), selections => {
			localStorage.generations = JSON.stringify(selections);
		}, null, 1);
	});
	element.appendChild(generationsButton);
	
	doDialog({
		title: "Options",
		titleJustification: "center",
		element: element
	});
}

window.onAnswerInput = onAnswerInput;