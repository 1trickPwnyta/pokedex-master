import { Settings } from "./settings";

export class Sound {
	static click = Sound.load(new URL("../audio/click.wav", import.meta.url).href);
	static reject = Sound.load(new URL("../audio/reject.wav", import.meta.url).href);
	static giveup = Sound.load(new URL("../audio/giveup.wav", import.meta.url).href);
	static win = Sound.load(new URL("../audio/win.wav", import.meta.url).href);
	
	static load(url) {
		const audio = new Audio(url);
		return new Sound(audio);
	}
	
	audio;
	
	constructor(audio) {
		this.audio = audio;
	}
	
	play() {
		if (!Settings.isMuteAudio()) this.audio.play();
	}
};
