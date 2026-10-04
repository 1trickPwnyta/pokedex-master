import { Game } from "./game";
import { Graphics } from "./graphics";
import { Layout } from "./layout";
import { Theme } from "./theme";
import { Dialog } from "./dialog";
import { Settings } from "./settings";

Theme.apply(Settings.getTheme());

await Graphics.init();
Layout.init();
Game.init();

if (Settings.isFirstTime()) {
	Settings.setFirstTime(false);
	Dialog.showHelp();
}

window.onMenuClick = Layout.onMenuClick;
window.onAnswerInput = Layout.onAnswerInput;
