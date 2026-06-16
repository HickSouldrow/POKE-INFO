import axios from 'axios';
import { Pokemon } from '../@types/pokemon';

const api = axios.create({
  baseURL: 'https://pokeapi.co/api/v2',
});

// Pokémons de 1ª geração (Kanto) -> mesmo universo já usado no Dashboard/Explorar
export const MAX_BATTLE_POKEMON_ID = 151;

function mapPokemonDetail(data: any): Pokemon {
  return {
    nome: data.name,
    index: data.id.toString().padStart(3, '0'),
    tipos: data.types.map((t: any) => t.type.name),
    imagem: data.sprites.front_default,
    poderes: data.stats.map((s: any) => ({
      nome: s.stat.name,
      forca: s.base_stat,
    })),
  };
}

export const getPokemons = async (limit = 151): Promise<Pokemon[]> => {
  const response = await api.get(`/pokemon?limit=${limit}`);
  const list = response.data.results;

  const detailedList = await Promise.all(
    list.map(async (pokemon: { url: string }) => {
      const detailRes = await axios.get(pokemon.url);
      return mapPokemonDetail(detailRes.data);
    })
  );

  return detailedList;
};

// Busca um Pokémon aleatório direto na PokéAPI (usado pelo botão de batalha)
export const getRandomPokemon = async (maxId = MAX_BATTLE_POKEMON_ID): Promise<Pokemon> => {
  const randomId = Math.floor(Math.random() * maxId) + 1;
  const response = await api.get(`/pokemon/${randomId}`);
  return mapPokemonDetail(response.data);
};
