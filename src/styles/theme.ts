import { StyleSheet } from 'react-native';

export const Theme = {
  // --- DESIGN TOKENS ---
  colors: {
    background: '#1C1917', 
    surface: '#292524',    
    primaryRed: '#FF1F1F', 
    
    textMain: '#FFFFFF',   
    textSecondary: '#D6D3D1',
    white: '#FFFFFF',
    ghostWhite: 'rgba(255, 255, 255, 0.1)',
    
    // Cores dos Tipos 
types: {
      fire: { color: '#FF4422', bg: 'rgba(255, 68, 34, 0.2)' },
      water: { color: '#3399FF', bg: 'rgba(51, 153, 255, 0.2)' },
      grass: { color: '#77CC55', bg: 'rgba(119, 204, 85, 0.2)' },
      electric: { color: '#FFCC33', bg: 'rgba(255, 204, 51, 0.2)' },
      poison: { color: '#AA5599', bg: 'rgba(170, 85, 153, 0.2)' },
      ghost: { color: '#6666BB', bg: 'rgba(102, 102, 187, 0.2)' },
      psychic: { color: '#F85888', bg: 'rgba(248, 88, 136, 0.2)' },
      fairy: { color: '#EE99AC', bg: 'rgba(238, 153, 172, 0.2)' },
      ground: { color: '#E0C068', bg: 'rgba(224, 192, 104, 0.2)' },
      dragon: { color: '#7038F8', bg: 'rgba(112, 56, 248, 0.2)' },
      steel: { color: '#B8B8D0', bg: 'rgba(184, 184, 208, 0.2)' },
      rock: { color: '#B8A038', bg: 'rgba(184, 160, 56, 0.2)' },
      fighting: { color: '#C03028', bg: 'rgba(192, 48, 40, 0.2)' },
      ice: { color: '#98D8D8', bg: 'rgba(152, 216, 216, 0.2)' },
      bug: { color: '#A8B820', bg: 'rgba(168, 184, 32, 0.2)' },
      flying: { color: '#A890F0', bg: 'rgba(168, 144, 240, 0.2)' },
      normal: { color: '#A8A878', bg: 'rgba(168, 168, 120, 0.2)' },
      dark: { color: '#705848', bg: 'rgba(112, 88, 72, 0.2)' },
    }
  },

  // --- COMPONENT STYLES ---
  styles: StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#1C1917', 
      padding: 20,
    },
    card: {
      backgroundColor: '#292524',
      borderRadius: 16,
      padding: 20,
      gap: 12,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.15)',
      
      shadowColor: '#FF1F1F',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3, 
      shadowRadius: 10,
      elevation: 10, 
    },
    divider: {
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      marginVertical: 8,
    },
    pokemonName: {
      fontSize: 22,
      fontWeight: '900',
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: 2,
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1.2,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      alignItems: 'center',
    },
    badgeText: {
      fontSize: 12,
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    // No seu arquivo de estilo do Input:
input: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1C1917',
    borderWidth: 2,
    borderColor: 'rgba(214, 60, 60, 0.2)',
    
  
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
}
  })
} as const;