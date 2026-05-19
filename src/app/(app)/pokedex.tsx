// Pokedex.tsx — visual do Dashboard aplicado
import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, Image, Platform, StyleSheet, ViewStyle,
} from 'react-native';
import { List } from '../../components/list';
import { PokeballLoading } from '../../components/pokeball-loading';
import { Pokemon, Poder } from '../../components/@types/pokemon';
import { TYPE_MAP } from '../../constants/pokemon';
import { Theme } from '../../styles/theme';
import { getPokemons } from '@/src/components/integrations/pokemonIntegration';

const mapType = (t: string) => TYPE_MAP[t] ?? 'normal';

const STAT_ABBR: Record<string, string> = {
    hp: 'HP',
    attack: 'ATK',
    defense: 'DEF',
    'special-attack': 'SP.A',
    'special-defense': 'SP.D',
    speed: 'SPD',
};

export default function Pokedex() {
    const [loading, setLoading] = useState(true);
    const [pokemons, setPokemons] = useState<Pokemon[]>([]);

    useEffect(() => {
        async function loadData() {
            try {
                const data = await getPokemons(151);
                setPokemons(data);
            } catch (e) {
                console.error('Erro ao carregar pokémons:', e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleLoadMore = useCallback(() => {}, []);

    const renderPokemonCard = useCallback((pokemon: Pokemon) => {
        const ptTypes = pokemon.tipos.map(mapType);
        const primaryType = ptTypes[0] as keyof typeof Theme.colors.types;
        const typeInfo = Theme.colors.types[primaryType] || Theme.colors.types.grass;

        return (
            <View style={{ paddingVertical: 10, position: 'relative' }}>

                {/* Badges de tipo — canto superior direito (igual ao Dashboard) */}
                <View style={{ position: 'absolute', top: 0, right: 0, flexDirection: 'row', gap: 4, zIndex: 10 }}>
                    {ptTypes.map((t) => {
                        const tKey = t as keyof typeof Theme.colors.types;
                        const tInfo = Theme.colors.types[tKey] || Theme.colors.types.grass;
                        return (
                            <View
                                key={t}
                                style={[Theme.styles.badge, {
                                    borderColor: tInfo.color,
                                    backgroundColor: tInfo.bg,
                                    paddingHorizontal: 8,
                                    borderWidth: 1.5,
                                }]}
                            >
                                <Text style={[Theme.styles.badgeText, { color: tInfo.color, fontSize: 9 }]}>
                                    {t}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* Linha principal: imagem + info (igual ao Dashboard) */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>

                    {/* Imagem com borda vermelha (padrão Dashboard) */}
                    <View style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 12,
                        padding: 6,
                        marginRight: 15,
                        borderWidth: 2,
                        borderColor: Theme.colors.primaryRed,
                        shadowColor: typeInfo.color,
                        shadowOpacity: 0.4,
                        shadowRadius: 6,
                        elevation: 5,
                    }}>
                        <Image
                            source={{ uri: pokemon.imagem }}
                            style={{ width: 90, height: 90 }}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={[Theme.styles.pokemonName, { fontSize: 18, marginBottom: 4, marginTop: 10 }]}>
                            {pokemon.nome}
                        </Text>

                        {/* Poderes */}
                        <Text style={{ color: typeInfo.color + 'CC', fontSize: 8, letterSpacing: 2, marginBottom: 6 }}>
                            PODERES
                        </Text>
                        <View style={{ gap: 4 }}>
                            {pokemon.poderes.map((poder: Poder) => (
                                <View key={poder.nome} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text style={{ color: 'rgba(240,240,240,0.4)', fontSize: 8, width: 44 }}>
                                        {STAT_ABBR[poder.nome] ?? poder.nome.slice(0, 6).toUpperCase()}
                                    </Text>
                                    <View style={{ flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                                        <View style={{
                                            height: '100%',
                                            width: `${Math.min((poder.forca / 150) * 100, 100)}%` as any,
                                            backgroundColor: typeInfo.color,
                                            borderRadius: 2,
                                            opacity: 0.85,
                                        }} />
                                    </View>
                                    <Text style={{ color: typeInfo.color, fontSize: 9, width: 24, textAlign: 'right' }}>
                                        {poder.forca}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Barra colorida por tipo na base (igual ao Dashboard) */}
                        <View style={{
                            height: 4,
                            backgroundColor: typeInfo.color,
                            width: '100%',
                            borderRadius: 2,
                            marginTop: 10,
                            shadowColor: typeInfo.color,
                            shadowOpacity: 1,
                            shadowRadius: 6,
                            elevation: 6,
                        }} />
                    </View>
                </View>
            </View>
        );
    }, []);

    if (loading) return <PokeballLoading />;

    return (
        <View style={Theme.styles.container}>
      
            <Text style={[Theme.styles.pokemonName, { fontSize: 10, color: Theme.colors.primaryRed, letterSpacing: 3, paddingHorizontal: 20, marginTop: 8, marginBottom: 4 }]}>
                POKÉDEX
            </Text>
            <List
                data={pokemons}
                onLoadMore={handleLoadMore}
                renderItemContent={renderPokemonCard}
            />
        </View>
    );
}