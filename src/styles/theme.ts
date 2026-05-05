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
    
    // Cores dos Tipos (Mantidas)
    types: {
      fire: { color: '#FF4422', bg: 'rgba(255, 68, 34, 0.2)' },
      water: { color: '#3399FF', bg: 'rgba(51, 153, 255, 0.2)' },
      grass: { color: '#77CC55', bg: 'rgba(119, 204, 85, 0.2)' },
      electric: { color: '#FFCC33', bg: 'rgba(255, 204, 51, 0.2)' },
      poison: { color: '#AA5599', bg: 'rgba(170, 85, 153, 0.2)' },
      ghost: { color: '#6666BB', bg: 'rgba(102, 102, 187, 0.2)' },
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
    }
  })
} as const;