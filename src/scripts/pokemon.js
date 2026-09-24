import pokemon from "../data/pokemon.json";

export class Pokemon {
	static getPokemon(number) {
		return pokemon[number - 1];
	}
	
	static matchesPokemon(input) {
		return pokemon.some(p => Pokemon.simplifyName(p.name) == Pokemon.simplifyName(input));
	}
	
	static simplifyName(name) {
		return name.toLowerCase().replaceAll(/[^a-z0-9]/g, "").replace(/^0+/, "");
	}
};
