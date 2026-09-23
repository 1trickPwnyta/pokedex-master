import arrayShuffle from "array-shuffle";

import { Pokemon } from "./pokemon";
import { Graphics } from "./graphics";
import { Sound } from "./sound";
import { Layout } from "./layout";
import { Dialog } from "./dialog";
import { Settings } from "./settings";
import data from "../data/data.json";

export class Game {
	static optionStart = { text: "Start", action: Game.start };
	static optionGiveup = { text: "Give up", action: Game.giveUp };
	static optionRestart = { text: "Restart", action: Game.restart };
	static optionHelp = { image: new URL("../graphics/help-box.png", import.meta.url).href, action: Dialog.showHelp };
	static optionSettings = { image: new URL("../graphics/cog-box.png", import.meta.url).href, action: Dialog.showSettings };
	
	static board;
	static level = -1;
	static startTime;
	
	static init() {
		Game.buildBoard();
	}
	
	static getCurrentPokemon() {
		return Pokemon.getPokemon(Game.board[Game.level]);
	}
	
	static simplifyName(name) {
		return name.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
	}
	
	static start() {
		Game.startTime = new Date();
		Layout.startGame();
		if (!Game.board || !Game.board.length) {
			Game.buildBoard();
		}
		Game.level = -1;
		Game.nextLevel();
	}

	static restart() {
		Game.start();
	}

	static reset() {
		Game.stop();
		Game.level = -1;
		Layout.reset();
	}

	static stop() {
		Layout.stopGame();
		Game.level = -1;
		Game.buildBoard();
	}
	
	static giveUp() {
		Dialog.confirm("You really want to give up?", () => {
			Sound.giveup.play();
			if (!Settings.isReverseMode()) {
				Layout.setQuestion({
					text: `${Game.getCurrentPokemon().name} is`,
					number: Game.board[Game.level],
					innerClass: "swirl-x",
					outerClass: "swirl-y"
				});
			} else {
				Layout.setQuestion({
					text: `${Game.board[Game.level]} is ${Game.getCurrentPokemon().name}!`,
					image: Graphics.getSpriteUrl(Game.board[Game.level], Game.getCurrentPokemon()),
					innerClass: "swirl-x",
					outerClass: "swirl-y"
				});
			}
			Game.stop();
		});
	}
	
	static buildBoard() {
		const generations = Settings.getGenerations();
		Game.board = [];
		for (const generation of data.generations.filter(g => generations.includes(g.name))) {
			Game.board = [ ...Game.board, ...Array.from({ length: generation.range[1] - generation.range[0] + 1 }, (_, i) =>  generation.range[0] + i) ];
		}
		Game.board = arrayShuffle(Game.board);
		const url = Graphics.getSpriteUrl(Game.board[0], Pokemon.getPokemon(Game.board[0]));
		Graphics.cacheImage(url);
		Graphics.cacheBackground(url);
	}
	
	static nextLevel() {
		if (Game.level > -1) {
			Sound.click.play();
			Layout.collect();
		}
		Game.level++;
		Layout.updateProgress();
		
		if (Game.level < Game.board.length) {
			const currentPokemon = Game.getCurrentPokemon();
			const url = Graphics.getSpriteUrl(Game.board[Game.level], currentPokemon);
			if (Settings.isReverseMode()) {
				Layout.setQuestion({
					number: Game.board[Game.level]
				});
				Graphics.cacheImage(url);
				Graphics.cacheBackground(url);
			} else {
				Layout.setQuestion({
					text: currentPokemon.name,
					image: url
				});
				if (Game.level < Game.board.length - 1) {
					const nextUrl = Graphics.getSpriteUrl(Game.board[Game.level + 1], Pokemon.getPokemon(Game.board[Game.level + 1]));
					Graphics.cacheImage(nextUrl);
					Graphics.cacheBackground(nextUrl);
				}
			}
		} else {
			Game.win();
		}
	}
	
	static win() {
		Sound.win.play();
		Game.stop();
		const generations = Settings.getGenerations();
		let winCount = Game.board.length;
		if (generations.length == 1) {
			winCount = `every ${generations[0]}`;
		} else if (generations.length == 9) {
			winCount = "every";
		}
		Layout.setQuestion({
			text: `Good job!<br />You ${!Settings.isReverseMode() ? "numbered" : "named"} ${winCount} Pokémon in ${Layout.timer.innerText}.`
		});
	}
};
