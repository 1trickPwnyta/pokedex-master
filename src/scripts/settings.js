import data from "../data/data.json";

const PREFIX = "pokedex_master_";
const MUTE_AUDIO = `${PREFIX}muteAudio`;
const GENERATIONS = `${PREFIX}generations`;
const GAMEPLAY = `${PREFIX}gameplay`;

export class Settings {
	static normalMode = "Normal";
	static reverseMode = "Reverse";
	static orderedMode = "Ordered";
	
	static isMuteAudio() {
		return JSON.parse(localStorage[MUTE_AUDIO] ?? 0) || false;
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
	
	static isOrderedMode() {
		return Settings.getGameplay().mode == Settings.orderedMode;
	}
};
