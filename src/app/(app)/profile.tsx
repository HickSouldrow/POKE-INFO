import React from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { Colors } from '@/constants/theme';
import { Header } from '@/components/header/header'; // Mantendo o mesmo Header do Dashboard
import { useAuth } from '../../context/AuthContext'; // Importado para pegar os dados reais se necessário

const isWeb = Platform.OS === 'web';

const XP_TOTAL = 100;
const XP_ATUAL = 12;

export default function Perfil() {
    const { user } = useAuth(); // Caso queira usar o user.nome dinâmico futuramente

    return (
        <View style={styles.wrapper}>
            {/* Header Componentizado idêntico ao do Dashboard */}
            <Header />

            <View style={styles.content}>
                {/* Outer Frame: O mesmo container com borda brilhante e efeito glow dos cards do Dashboard */}
                <View style={styles.outerFrame}>
                    {/* Linha de efeito Shimmer/Brilho atravessando o card */}
                    <View style={styles.shimmerStrip} />

                    {/* Inner Card: Fundo escuro/semi-transparente tecnológico */}
                    <View style={styles.innerCard}>
                        
                        {/* Top Bar do Card de Perfil */}
                        <View style={styles.topBar}>
                            <Text style={styles.pokeName}>TREINADOR</Text>
                            <Text style={styles.indexNumber}>#001</Text>
                        </View>

                        {/* Avatar Wrapper com os corners estilo interface do Dashboard */}
                        <View style={styles.imageWrapper}>
                            <View style={styles.cornerTL} />
                            <View style={styles.cornerBR} />
                            <Image
                                source={require('../../../assets/images/perfil.png')}
                                style={styles.avatar}
                                resizeMode="cover"
                            />
                        </View>

                        {/* Nome e Título */}
                        <Text style={styles.name}>{user?.name || 'Ash Ketchun'}</Text>
                        <Text style={styles.role}>Treinador Pokémon</Text>

                        {/* Seção de Stats imitando a estrutura de barras de poder do Dashboard */}
                        <View style={styles.statsSection}>
                            
                            {/* Experiência */}
                            <View style={styles.statRow}>
                                <Text style={styles.statName}>XP</Text>
                                <View style={styles.statBarBg}>
                                    <View style={[styles.statBarFill, { width: `${(XP_ATUAL / XP_TOTAL) * 100}%` }]} />
                                </View>
                                <Text style={styles.statValue}>{XP_ATUAL}/{XP_TOTAL}</Text>
                            </View>

                            {/* Vitórias */}
                            <View style={styles.statRow}>
                                <Text style={[styles.statName, { color: Colors.game?.win || '#4CAF50' }]}>🏆 VIT</Text>
                                <View style={styles.statBarBg}>
                                    <View style={[styles.statBarFill, { width: '80%', backgroundColor: Colors.game?.win || '#4CAF50' }]} />
                                </View>
                                <Text style={[styles.statValue, { color: Colors.game?.win || '#4CAF50' }]}>8/10</Text>
                            </View>

                            {/* Derrotas */}
                            <View style={styles.statRow}>
                                <Text style={[styles.statName, { color: Colors.game?.loss || '#F44336' }]}>💀 DER</Text>
                                <View style={styles.statBarBg}>
                                    <View style={[styles.statBarFill, { width: '20%', backgroundColor: Colors.game?.loss || '#F44336' }]} />
                                </View>
                                <Text style={[styles.statValue, { color: Colors.game?.loss || '#F44336' }]}>2/10</Text>
                            </View>

                        </View>
                    </View>

                    {/* Anel de Glow externo do card */}
                    <View style={styles.glowRing} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: Colors.background || '#121214',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 32,
    },

    /* Estilização baseada no Outer Frame dos Cards do Dashboard */
    outerFrame: {
        width: '100%',
        maxWidth: 350,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        overflow: 'hidden',
        backgroundColor: 'rgba(20, 20, 24, 0.85)',
        position: 'relative',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },

    /* Efeito de listra brilhante oblíqua do Dashboard */
    shimmerStrip: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        transform: [{ skewY: '-15deg' }, { translateY: -30 }],
    },

    innerCard: {
        padding: 16,
        alignItems: 'center',
    },

    /* Top Bar idêntica a dos cards de Pokémon */
    topBar: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.15)',
        marginBottom: 24,
    },
    pokeName: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 12,
        letterSpacing: 1,
    },
    indexNumber: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '800',
        fontSize: 12,
    },

    /* Moldura de Imagem Cyberpunk/TCG do Dashboard */
    imageWrapper: {
        width: 110,
        height: 110,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        marginBottom: 16,
        padding: 4,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 2,
    },
    /* Detalhes de cantos futuristas */
    cornerTL: {
        position: 'absolute',
        top: -2,
        left: -2,
        width: 8,
        height: 8,
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderColor: '#FFF',
    },
    cornerBR: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 8,
        height: 8,
        borderBottomWidth: 2,
        borderRightWidth: 2,
        borderColor: '#FFF',
    },

    /* Textos principais */
    name: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    role: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginTop: 4,
        marginBottom: 24,
        fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
    },

    /* Seção de status com barras horizontais simulando os poderes do Pokémon */
    statsSection: {
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 8,
        padding: 12,
        gap: 12,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statName: {
        width: 50,
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 11,
        fontWeight: '800',
    },
    statBarBg: {
        flex: 1,
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 4,
        marginHorizontal: 12,
        overflow: 'hidden',
    },
    statBarFill: {
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
    },
    statValue: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '800',
        width: 55,
        textAlign: 'right',
    },

    /* Anel de Glow sutil nas bordas traseiras */
    glowRing: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        pointerEvents: 'none',
    },
});