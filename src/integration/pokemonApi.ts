import axios from 'axios';

// Backend do projeto (AWS API Gateway). Diferente de `pokemonIntegration.ts`,
// que consome a PokéAPI pública para obter detalhes/sprites dos Pokémon.
const API_BASE_URL =
  'https://lnh1dhp1mj.execute-api.us-east-1.amazonaws.com/api-pokemon';

export const pokemonApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// O backend identifica o usuário por um `userId` (UUID) retornado no login/registro.
export type AuthResponse = {
  userId: string;
};

// As respostas de erro do backend seguem o formato:
// { date, status, error, message } — sempre com uma mensagem amigável em PT-BR
// (ex.: "Username já está em uso", "Senha deve ter no mínimo 6 caracteres").
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
  }
  return fallback;
}

// POST /auth/v1/register — cria a conta (e já gera um time inicial no servidor).
export async function registerUser(
  username: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await pokemonApi.post<AuthResponse>('/auth/v1/register', {
    username,
    password,
  });
  return data;
}

// POST /auth/v1/login — autentica e devolve o userId usado nas demais rotas.
export async function loginUser(
  username: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await pokemonApi.post<AuthResponse>('/auth/v1/login', {
    username,
    password,
  });
  return data;
}
