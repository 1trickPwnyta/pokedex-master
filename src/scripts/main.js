import { Game } from "./game";
import { Graphics } from "./graphics";
import { Layout } from "./layout";

await Graphics.init();
Layout.init();
Game.init();

window.onAnswerInput = Layout.onAnswerInput;
