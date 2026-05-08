import { StyleSheet } from 'react-native';
import { Theme } from '../../styles/theme'; 

export const styles = StyleSheet.create({
    button: {
        width: '100%',
        height: 56, 
        backgroundColor: Theme.colors.surface, 
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        
        borderWidth: 2,
        borderColor: Theme.colors.primaryRed,
        shadowColor: Theme.colors.primaryRed,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6, 
    },
    title: {
        color: Theme.colors.white,
        fontSize: 14,
        fontWeight: '900', 
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    }
});