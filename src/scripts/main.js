import { Game } from "./game";
import { Graphics } from "./graphics";
import { Layout } from "./layout";
import { Theme } from "./theme";
import { Settings } from "./settings";

Theme.apply(Settings.getTheme());

await Graphics.init();
Layout.init();
Game.init();

window.onAnswerInput = Layout.onAnswerInput;
