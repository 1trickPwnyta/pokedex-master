import { Theme } from "./theme";
import data from "../data/data.json";

const PREFIX = "pokedex_master_";
const MUTE_AUDIO = `${PREFIX}muteAudio`;
const GENERATIONS = `${PREFIX}generations`;
const GAMEPLAY = `${PREFIX}gameplay`;
const APPEARANCE = `${PREFIX}appearance`;
const FIRST_TIME = `${PREFIX}firstTime`;

export class Settings {
	static normalMode = "Normal";
	static reverseMode = "Reverse";
	static blitzMode = "Blitz";
	static orderedMode = "Ordered";
	
	static isMuteAudio() {
		return JSON.parse(localStorage[MUTE_AUDIO] ?? "false");
	}
	
	static setMuteAudio(muteAudio) {
		localStorage[MUTE_AUDIO] = JSON.stringify(muteAudio);
	}
	
	static getGenerations() {
		const generations = JSON.parse(localStorage[GENERATIONS] ?? "[]");
		return generations.length ? generations : [ data.generations[0].name ]; 
	}
	
	static setGenerations(generations) {
		localStorage[GENERATIONS] = JSON.stringify(generations);
	}
	
	static getGameplay() {
		const gameplay = JSON.parse(localStorage[GAMEPLAY] ?? "{}");
		if (gameplay.reverseMode) {
			gameplay.mode = Settings.reverseMode;
			gameplay.reverseMode = undefined;
		}
		return gameplay;
	}
	
	static isReverse() {
		const gameplay = Settings.getGameplay();
		return gameplay.mode == Settings.reverseMode || gameplay.mode == Settings.orderedMode;
	}
	
	static setGameplayMode(mode) {
		const gameplay = Settings.getGameplay();
		gameplay.mode = mode;
		localStorage[GAMEPLAY] = JSON.stringify(gameplay);
	}
	
	static isBlitzMode() {
		return Settings.getGameplay().mode == Settings.blitzMode;
	}
	
	static isOrderedMode() {
		return Settings.getGameplay().mode == Settings.orderedMode;
	}
	
	static getAppearance() {
		return JSON.parse(localStorage[APPEARANCE] ?? "{}");
	}
	
	static setAppearance(appearance) {
		localStorage[APPEARANCE] = JSON.stringify(appearance);
	}
	
	static getTheme() {
		return Settings.getAppearance().theme ?? Theme.default;
	}
	
	static setTheme(theme) {
		const appearance = Settings.getAppearance();
		appearance.theme = theme;
		localStorage[APPEARANCE] = JSON.stringify(appearance);
	}
	
	static isFirstTime() {
		return JSON.parse(localStorage[FIRST_TIME] ?? "true");
	}
	
	static setFirstTime(firstTime) {
		localStorage[FIRST_TIME] = JSON.stringify(firstTime);
	}
};
