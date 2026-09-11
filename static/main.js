import arrayShuffle from "https://esm.sh/array-shuffle@3.0.0";

const MAIN = document.getElementById("main");
const QUESTION = document.getElementById("question");
const ANSWER = document.getElementById("answer");
const ANSWER_BOX = document.getElementById("answer-box");
const ANSWER_FIELD = document.getElementById("answer-field");
const OPTIONS = document.getElementById("options");
const MESSAGE_BACKGROUND = document.getElementById("message-background");

const OPTION_START = { text: "Start", action: onOptionStart };
const OPTION_GIVEUP = { text: "Give up", action: onOptionGiveUp };
const OPTION_RESTART = { text: "Restart", action: onOptionRestart };

let level;
let board;

let pokemonFetch = await fetch("./pokemon.json");
let pokemon = await pokemonFetch.json();

const options = [];
addOption(OPTION_START);

function getCurrentPokemon() {
	return pokemon[board[level] - 1];
}

function makeButton(text, action) {
	let button = document.createElement("div");
	button.className = "option";
	button.innerText = text;
	button.onclick = action;
	return button;
}

function addOption(opt) {
	let option = makeButton(opt.text, opt.action);
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
		stopGame();
		QUESTION.innerText = `It was ${getCurrentPokemon().name}!`;
	});
}

function onOptionRestart() {
	startGame();
}

function startGame() {
	removeAllOptions();
	addOption(OPTION_GIVEUP);
	buildBoard();
	level = -1;
	showAnswerBox();
	nextLevel();
}

function stopGame() {
	removeAllOptions();
	addOption(OPTION_RESTART);
	hideAnswerBox();
}

function win() {
	stopGame();
	QUESTION.innerText = "Good job!"
}

function buildBoard() {
	board = Array.from({ length: pokemon.length }, (_, i) => i + 1);
	board = arrayShuffle(board);
}

function nextLevel() {
	level++;
	
	if (level < board.length) {
		let questionNumber = document.createElement("div");
		questionNumber.className = "question-number";
		questionNumber.innerText = board[level];
		QUESTION.innerHTML = "";
		QUESTION.appendChild(questionNumber);
	} else {
		win();
	}
}

function clearQuestion() {
	QUESTION.innerHTML = "";
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
	void ANSWER_FIELD.offsetHeight;
	ANSWER_FIELD.style.transition = "box-shadow 0.5s ease";
	ANSWER_FIELD.style.boxShadow = normalShadow;
	void ANSWER_FIELD.offsetHeight;
	ANSWER_FIELD.style.transition = "";
}

function confirm(message, onYes, onNo, onCancel) {
	MESSAGE_BACKGROUND.innerHTML = "";
	MESSAGE_BACKGROUND.style.visibility = "visible";
	
	let messageBox = document.createElement("div");
	messageBox.className = "message-box card light";
	
	let messageArea = document.createElement("div");
	messageArea.className = "message-area";
	messageArea.innerText = message;
	messageBox.appendChild(messageArea);
	
	let buttonArea = document.createElement("div");
	buttonArea.className = "button-area";
	let yesButton = makeButton("Yes", () => closeMessage(onYes));
	buttonArea.appendChild(yesButton);
	let noButton = makeButton("No", () => closeMessage(onNo));
	buttonArea.appendChild(noButton);
	messageBox.appendChild(buttonArea);
	
	let messageClose = document.createElement("div");
	messageClose.className = "message-close";
	messageClose.onclick = () => closeMessage(onCancel ?? onNo);
	messageBox.appendChild(messageClose);
	
	MESSAGE_BACKGROUND.appendChild(messageBox);
}

function closeMessage(callback = () => {}) {
	MESSAGE_BACKGROUND.style.visibility = "hidden";
	callback();
}

window.onOptionStart = onOptionStart;
window.onOptionGiveUp = onOptionGiveUp;
window.onOptionRestart = onOptionRestart;
window.onAnswerInput = onAnswerInput;