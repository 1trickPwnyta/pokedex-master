import data from "../data/data.json";

const PREFIX = "pokedex_master_";
const MUTE_AUDIO = `${PREFIX}muteAudio`;
const GENERATIONS = `${PREFIX}generations`;
const GAMEPLAY = `${PREFIX}gameplay`;

export class Settings {
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
		return JSON.parse(localStorage[GAMEPLAY] ?? "{}");
	}
	
	static isReverseMode() {
		return Settings.getGameplay().reverseMode ?? false;
	}
	
	static setReverseMode(reverseMode) {
		const gameplay = Settings.getGameplay();
		gameplay.reverseMode = reverseMode;
		localStorage[GAMEPLAY] = JSON.stringify(gameplay);
	}
};
