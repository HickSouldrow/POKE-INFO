import { StyleSheet } from 'react-native';

// --- TIPOS E CONFIGURAÇÕES DE POKÉMON ---
export type PokemonType =
  | 'fogo' | 'água' | 'grama' | 'elétrico' | 'psíquico' | 'gelo'
  | 'dragão' | 'trevas' | 'fada' | 'lutador' | 'veneno' | 'terra'
  | 'pedra' | 'inseto' | 'fantasma' | 'aço' | 'voador' | 'normal';

export const TYPE_MAP: Record<string, string> = {
  fire: 'fogo',      water: 'água',     grass: 'grama',
  electric: 'elétrico', psychic: 'psíquico', ice: 'gelo',
  dragon: 'dragão',  dark: 'trevas',    fairy: 'fada',
  fighting: 'lutador', poison: 'veneno', ground: 'terra',
  rock: 'pedra',     bug: 'inseto',     ghost: 'fantasma',
  steel: 'aço',      flying: 'voador',  normal: 'normal',
};

export const TYPE_ICONS: Record<string, string> = {
  fogo: '🔥', água: '💧', grama: '🌿', elétrico: '⚡',
  psíquico: '🔮', gelo: '❄️', dragão: '🐉', trevas: '🌑',
  fada: '✨', lutador: '🥊', veneno: '☠️', terra: '🪨',
  pedra: '💎', inseto: '🐛', fantasma: '👻', aço: '⚙️',
  voador: '🌬️', normal: '⭐',
};

// --- CORES REAIS DOS TIPOS (Adicionado para corrigir os cards) ---
export const TYPE_COLORS: Record<string, { color: string; accent: string; bg: string }> = {
  fogo: { color: '#FF4422', accent: '#FF4422', bg: '#FF4422' },
  água: { color: '#3399FF', accent: '#3399FF', bg: '#3399FF' },
  grama: { color: '#4EBC43', accent: '#4EBC43', bg: '#4EBC43' },
  elétrico: { color: '#FFCE31', accent: '#FFCE31', bg: '#FFCE31' },
  veneno: { color: '#A85098', accent: '#A85098', bg: '#A85098' },
  fantasma: { color: '#605CA8', accent: '#605CA8', bg: '#605CA8' },
  psíquico: { color: '#FA5082', accent: '#FA5082', bg: '#FA5082' },
  fada: { color: '#F4B0C7', accent: '#F4B0C7', bg: '#F4B0C7' },
  terra: { color: '#DDB650', accent: '#DDB650', bg: '#DDB650' },
  dragão: { color: '#6A4DFF', accent: '#6A4DFF', bg: '#6A4DFF' },
  aço: { color: '#A0A0C0', accent: '#A0A0C0', bg: '#A0A0C0' },
  pedra: { color: '#B49C44', accent: '#B49C44', bg: '#B49C44' },
  lutador: { color: '#BA2C24', accent: '#BA2C24', bg: '#BA2C24' },
  gelo: { color: '#7CC8C8', accent: '#7CC8C8', bg: '#7CC8C8' },
  inseto: { color: '#99A826', accent: '#99A826', bg: '#99A826' },
  voador: { color: '#907CEE', accent: '#907CEE', bg: '#907CEE' },
  normal: { color: '#929278', accent: '#929278', bg: '#929278' },
  trevas: { color: '#665040', accent: '#665040', bg: '#665040' },
};

// --- AUTENTICAÇÃO ---
export const VALID_USER = {
  name: 'kleber',
  password: 'kleber123',
};

export function validateLogin(name: string, password: string): boolean {
  return (
    name.trim().toLowerCase() === VALID_USER.name.toLowerCase() &&
    password.trim() === VALID_USER.password
  );
}

// --- PALETA DE CORES FLAT ---
export const Colors = {
  background: '#12100E', 
  surface: '#1A1816',
  primaryRed: '#E11D48', // Vermelho Pokédex destacado
  btnPrimary: '#E11D48',
  white: '#FFFFFF',
  textMain: '#FFFFFF',
  textSecondary: '#D6D3D1',
  whiteAlpha: {
    '05': 'rgba(255, 255, 255, 0.05)',
    '08': 'rgba(255, 255, 255, 0.08)',
    '10': 'rgba(255, 255, 255, 0.1)',
    '15': 'rgba(255, 255, 255, 0.15)',
    '20': 'rgba(255, 255, 255, 0.2)',
    '30': 'rgba(255, 255, 255, 0.3)',
    '35': 'rgba(255, 255, 255, 0.35)',
    '50': 'rgba(255, 255, 255, 0.5)',
  },
} as const;

// --- FUNÇÃO DE AUXÍLIO ATUALIZADA ---
export function getColor(types: string[]) {
  if (!types || types.length === 0) return TYPE_COLORS.normal;
  const primaryType = types[0];
  return TYPE_COLORS[primaryType] || TYPE_COLORS.normal;
}