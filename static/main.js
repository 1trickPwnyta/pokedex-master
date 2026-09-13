import arrayShuffle from "https://esm.sh/array-shuffle@3.0.0";
import dayjs from "https://esm.sh/dayjs@1/dayjs.min.js";
import duration from "https://esm.sh/dayjs@1/plugin/duration";
dayjs.extend(duration);

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
const MESSAGE_BACKGROUND = document.getElementById("message-background");

const OPTION_START = { text: "Start", action: onOptionStart };
const OPTION_GIVEUP = { text: "Give up", action: onOptionGiveUp };
const OPTION_RESTART = { text: "Restart", action: onOptionRestart };
const OPTION_HELP = { image: "./help-box.png", action: onOptionHelp };

const SOUND_CLICK = new Audio("./click.wav");
const SOUND_GIVEUP = new Audio("./giveup.wav");
const SOUND_WIN = new Audio("./win.wav");

let level;
let board;
let startTime;
let timerUpdate;

let metaFetch = await fetch("./meta.json");
let meta = await metaFetch.json();

let pokemonFetch = await fetch("./pokemon.json");
let pokemon = await pokemonFetch.json();

let dataFetch = await fetch("./data.json");
let data = await dataFetch.json();

const options = [];
addOption(OPTION_START);
addOption(OPTION_HELP);

function flushStyle(element) {
	void element.offsetHeight;
}

function cacheImage(url) {
	const image = new Image();
	image.fetchPriority = "high";
	image.src = url;
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
	let option = makeButton(opt.text, opt.image, opt.action);
	opt.option = option;
	OPTIONS.appendChild(option);
	options.push(opt);
}

function removeOption(opt) {
	let option = options.find(o => o.text == opt.text);
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

function updateTimer() {
	const milliseconds = new Date() - startTime;
	TIMER.innerText = dayjs.duration(milliseconds).format("mm:ss");
}

function updateProgress() {
	const progress = `${level}<br />/ ${pokemon.length}`;
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
	addOption(OPTION_HELP);
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
	addOption(OPTION_HELP);
	hideAnswerBox();
	if (timerUpdate) {
		clearInterval(timerUpdate);
		timerUpdate = null;
	}
}

function win() {
	SOUND_WIN.play();
	stopGame();
	setQuestion(`Good job!<br />You named ${pokemon.length} Pokémon in ${TIMER.innerText}.`);
}

function buildBoard() {
	board = Array.from({ length: pokemon.length }, (_, i) => i + 1);
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
	MESSAGE_BACKGROUND.innerHTML = "";
	MESSAGE_BACKGROUND.style.visibility = "visible";
	
	let messageBox = document.createElement("div");
	messageBox.className = "message-box card light";
	
	let messageArea = document.createElement("div");
	messageArea.className = "message-area";
	if (options.title) {
		messageArea.innerHTML = `<div class="message-title">${options.title}</div>`;
	}
	if (options.subtitle) {
		messageArea.innerHTML += `<div class="message-subtitle">${options.subtitle}</div>`;
	}
	if (options.message) {
		messageArea.innerHTML += `<div class="message-text">${options.message}</div>`;
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
	
	let messageClose = makeButton("", "./close-box.png", () => closeMessage(options.onCancel));
	messageClose.classList.add("message-close");
	messageBox.appendChild(messageClose);
	
	MESSAGE_BACKGROUND.appendChild(messageBox);
}

function confirm(message, onYes, onNo, onCancel) {
	let yesButton = makeButton("Yes", null, () => closeMessage(onYes));
	let noButton = makeButton("No", null, () => closeMessage(onNo));
	doDialog({ title: message, buttons: [ yesButton, noButton ], onCancel: onCancel });
}

function closeMessage(callback = () => {}) {
	MESSAGE_BACKGROUND.style.visibility = "hidden";
	callback();
}

function showHelp() {
	doDialog({
		title: `Pokédex Master v${meta.version}`,
		subtitle: "by 1trickPwnyta",
		message: `<p>So you can name all the Pokémon in dex order from memory and you think you're real smart, huh? But can you name them all <em>by dex number</em> in random order?</p>
<p>The path to Pokédex mastery is long and difficult. Do you have what it takes?</p>`
	});
}

window.onAnswerInput = onAnswerInput;