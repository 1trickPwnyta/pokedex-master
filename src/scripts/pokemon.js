import pokemon from "../data/pokemon.json";

export class Pokemon {
	static getPokemon(number) {
		return pokemon[number - 1];
	}
};
