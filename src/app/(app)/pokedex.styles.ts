import { StyleSheet, Platform } from 'react-native';
import { Colors } from '@/constants/pokemonTypes';

const isWeb = Platform.OS === 'web';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 54 : 20,
        paddingBottom: 16,
        backgroundColor: Colors.surface,
        borderBottomWidth: 2,
        borderBottomColor: Colors.primaryRed,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    backButtonText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    title: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    activeTab: {
        backgroundColor: 'rgba(255, 31, 31, 0.15)',
        borderColor: Colors.primaryRed,
    },
    tabText: {
        color: Colors.textSecondary,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    activeTabText: {
        color: Colors.white,
        fontWeight: '900',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 16,
        paddingBottom: 32,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    outerFrame: {
        borderRadius: 14,
        borderWidth: 2,
        overflow: 'hidden',
        marginBottom: 12,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    innerCard: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        paddingBottom: 8,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.15)',
    },
    pokeName: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'capitalize',
        color: '#FFF',
    },
    pokeIndex: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.7)',
    },
    imageWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 80,
        marginHorizontal: 8,
        marginVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    pokemonImage: {
        width: 65,
        height: 65,
    },
    typesRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4,
        paddingHorizontal: 6,
    },
    typePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderColor: 'rgba(255,255,255,0.25)',
    },
    typeEmoji: {
        fontSize: 8,
    },
    typeLabel: {
        fontSize: 7,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: '#FFF',
    },
    localOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
});