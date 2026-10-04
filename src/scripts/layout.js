import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

import { Pokemon } from "./pokemon";
import { Game } from "./game";
import { Graphics } from "./graphics";
import { Sound } from "./sound";
import { Button } from "./ui";
import { Dialog } from "./dialog";
import { Theme } from "./theme";
import { Settings } from "./settings";

const options = [];
let timerUpdate;
let countMistakes = true;

export class Layout {
	static main = document.getElementById("main");
	static loading = document.getElementById("loading");
	static timer = document.getElementById("timer");
	static questionText = document.getElementById("question-text");
	static questionImage = document.getElementById("question-image");
	static progress = document.getElementById("progress");
	static collection = document.getElementById("collection-container");
	static answer = document.getElementById("answer");
	static answerBox = document.getElementById("answer-box");
	static answerText = document.getElementById("answer-text");
	static answerField = document.getElementById("answer-field");
	static options = document.getElementById("options");
	
	static init() {
		Layout.reset();
		Layout.main.style.visibility = "visible";
		Layout.loading.style.opacity = "0";
		setTimeout(() => document.body.removeChild(Layout.loading), 1000);
	}
	
	static startGame() {
		Layout.removeAllOptions();
		Layout.addOption(Game.optionGiveup);
		Layout.answerField.type = !Settings.isReverse() ? "number" : "text";
		Layout.answerText.innerText = !Settings.isReverse() ? "What number is it?" : "Which Pokémon is it?";
		Layout.showAnswerBox();
		Layout.clearCollection();
		Layout.startTimer();
	}
	
	static stopGame() {
		Layout.removeAllOptions();
		Layout.addOption(Game.optionRestart);
		Layout.hideAnswerBox();
		Layout.stopTimer();
	}
	
	static reset() {
		Layout.removeAllOptions();
		Layout.addOption(Game.optionStart);
		Layout.setQuestion({
			text: "Welcome to<br />Pokédex Master",
			image: Graphics[Theme.current?.icon ?? "icon"],
			imageMask: true
		});
		Layout.clearCollection();
		Layout.timer.innerHTML = "";
		Layout.progress.innerHTML = "";
	}
	
	static setQuestion(options) {
		Layout.clearQuestion();
		Layout.questionText.innerHTML = options.text ?? "";
		if (options.number) {
			let questionNumber = document.createElement("div");
			questionNumber.className = `question-number ${options.outerClass}`;
			questionNumber.innerHTML = `<div class="${options.innerClass ?? ""}">${options.number}</div>`;
			Layout.questionText.appendChild(questionNumber);
		}
		Layout.questionImage.className = "";
		if (options.image) {
			Layout.questionImage.style.display = "initial";
			Layout.questionImage.className = options.outerClass ?? "";
			Layout.questionImage.innerHTML = "";
			document.documentElement.style.setProperty("--question-image-mask", `url(${options.image})`);
			Layout.questionImage.className = "question-image-mask";
		}
		if (options.sprite) {
			Layout.questionImage.style.display = "initial";
			Layout.questionImage.className = options.outerClass ?? "";
			const sprite = document.createElement("img");
			sprite.className = options.innerClass;
			sprite.src = options.sprite.url;
			sprite.style.transform = `translateY(${options.sprite.yoffset})`;
			Layout.questionImage.appendChild(sprite);
		}
	}

	static clearQuestion() {
		Layout.questionText.innerHTML = "";
		Layout.questionImage.innerHTML = "";
		Layout.questionImage.style.display = "none";
	}
	
	static addOption(opt) {
		const option = new Button({
			text: opt.text,
			image: opt.image,
			action: opt.action
		});
		opt.option = option;
		Layout.options.appendChild(option.element);
		options.push(opt);
	}

	static removeOption(opt) {
		const option = options.find(o => o.text == opt.text);
		if (option) {
			Layout.options.removeChild(option.option.element);
			options.splice(options.indexOf(option), 1);
		}
	}

	static removeAllOptions() {
		while (options.length) {
			Layout.removeOption(options[0]);
		}
	}
	
	static startTimer() {
		Layout.updateTimer();
		timerUpdate = setInterval(Layout.updateTimer, 1000);
	}
	
	static updateTimer() {
		const milliseconds = new Date() - Game.startTime;
		const duration = dayjs.duration(milliseconds);
		const minutes = Math.floor(duration.asMinutes());
		const seconds = duration.seconds();
		Layout.timer.innerText = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	}
	
	static stopTimer() {
		if (timerUpdate) {
			clearInterval(timerUpdate);
			timerUpdate = null;
		}
	}
	
	static showAnswerBox() {
		Layout.answerBox.style.visibility = "visible";
		Layout.answerField.focus();
	}

	static hideAnswerBox() {
		Layout.answerBox.style.visibility = "hidden";
	}
	
	static collect() {
		const existing = Array.from(Layout.collection.getElementsByClassName("collected"));
		const first = existing.length > 0 ? existing[0] : null;
		const preY = first?.getBoundingClientRect().top;
		const collected = document.createElement("div");
		collected.className = "collected card";
		collected.style.opacity = "0";
		const spriteInfo = Graphics.getSpriteUrl(Game.board[Game.level], Game.getCurrentPokemon());
		const collectedImage = document.createElement("img");
		collectedImage.className = "collected-image";
		collectedImage.src = spriteInfo.url;
		collected.innerHTML = `<div class="collected-number"><span class="small-symbol">#</span>${Game.board[Game.level]}</div>`;
		collected.appendChild(collectedImage);
		Layout.collection.prepend(collected);
		Layout.collection.scrollTop = 0;
		Graphics.flushStyle(collected);
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
	
	static clearCollection() {
		Layout.collection.innerHTML = "";
	}
	
	static updateProgress() {
		const progress = `${Game.level}<br />/ ${Game.board.length}`;
		Layout.progress.innerHTML = progress;
	}
	
	static onMenuClick() {
		Sound.click.play();
		Dialog.showSettings();
	}
	
	static onAnswerInput() {
		const answer = !Settings.isReverse() ? Game.board[Game.level].toString() : Pokemon.simplifyName(Game.getCurrentPokemon().name);
		const simplified = Pokemon.simplifyName(Layout.answerField.value);
		const makeGhost = className => {
			const ghost = document.createElement("div");
			ghost.className = className;
			ghost.style.left = `${Layout.answerField.getBoundingClientRect().left}px`;
			ghost.style.top = `${Layout.answerField.getBoundingClientRect().top}px`;
			ghost.innerText = Layout.answerField.value;
			Layout.answerBox.appendChild(ghost);
			setTimeout(() => Layout.answerBox.removeChild(ghost), 1000);
		};
		if (simplified == answer) {
			makeGhost("input-ghost");
			Layout.answerField.value = "";
			Graphics.blink(Layout.answerField);
			Game.nextLevel();
		} else if (!answer.startsWith(simplified)
				&& (!Settings.isReverse() || Pokemon.matchesPokemon(simplified))) {
			makeGhost("input-ghost bad mistake jitter");
			Layout.answerField.value = "";
			Sound.reject.play();
			if (countMistakes) {
				Game.mistakes++;
				countMistakes = false;
				setTimeout(() => countMistakes = true, 1000);
			}
		}
	}
};
