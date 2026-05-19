import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { PokeballLoading } from '@/components/pokeball-loading';
import { getPokemons } from '@/integration/pokemonIntegration';
import { Pokemon } from '@/@types/pokemon';
import { TYPE_MAP, TYPE_ICONS, getColor } from '@/constants/pokemonTypes';
import { styles } from '../(app)/pokedex.styles';

const mapType = (t: string) => TYPE_MAP[t] ?? 'normal';
const CARD_GAP = 10;
const GRID_H_PAD = 12;

type GenKey = 'gen1' | 'gen2' | 'gen3';

export default function pokedex({ onBack }: { onBack: () => void }) {
    const { width } = useWindowDimensions();
    const [loading, setLoading] = useState(true);
    const [allPokemons, setAllPokemons] = useState<Pokemon[]>([]);
    const [activeTab, setActiveTab] = useState<GenKey>('gen1');

    const cardWidth = Math.floor((width - GRID_H_PAD * 2 - CARD_GAP * 2) / 3);

    useEffect(() => {
        async function loadAll() {
            try {
                // Busca até o fim de Hoenn (ID 386)
                const data = await getPokemons(386);
                // Ordena crescentemente pelo número da Pokédex
                const ordered = [...data].sort((a, b) => Number(a.index) - Number(b.index));
                setAllPokemons(ordered);
            } catch (e) {
                console.error('Erro ao buscar Pokédex Completa:', e);
            } finally {
                setLoading(false);
            }
        }
        loadAll();
    }, []);

    // Filtra os pokémons em memória sem precisar fazer novas requisições
    const filteredPokemons = useMemo(() => {
        return allPokemons.filter(pokemon => {
            const index = Number(pokemon.index);
            if (activeTab === 'gen1') return index >= 1 && index <= 151;
            if (activeTab === 'gen2') return index >= 152 && index <= 251;
            if (activeTab === 'gen3') return index >= 252 && index <= 386;
            return false;
        });
    }, [allPokemons, activeTab]);

    return (
        <View style={styles.container}>
            {/* Header com botão voltar */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
                    <Text style={styles.backButtonText}>◀</Text>
                </TouchableOpacity>
                <Text style={styles.title}>POKÉDEX NACIONAL</Text>
            </View>

            {/* Abas seletores de Gerações */}
            <View style={styles.tabContainer}>
                {(['gen1', 'gen2', 'gen3'] as GenKey[]).map((gen, idx) => (
                    <TouchableOpacity
                        key={gen}
                        style={[styles.tab, activeTab === gen && styles.activeTab]}
                        onPress={() => setActiveTab(gen)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.tabText, activeTab === gen && styles.activeTabText]}>
                            {idx + 1}ª GEN
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Grid dos Pokémons */}
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.grid, { paddingHorizontal: GRID_H_PAD, gap: CARD_GAP }]}>
                    {filteredPokemons.map(pokemon => (
                        <MiniPokemonCard key={pokemon.index} pokemon={pokemon} cardWidth={cardWidth} />
                    ))}
                </View>
            </ScrollView>

            {loading && (
                <View style={styles.localOverlay}>
                    <PokeballLoading />
                </View>
            )}
        </View>
    );
}

// Card simplificado específico para listagem massiva (3 colunas)
function MiniPokemonCard({ pokemon, cardWidth }: { pokemon: Pokemon; cardWidth: number }) {
    const ptTypes = pokemon.tipos.map(mapType);
    const colors = getColor(ptTypes);

    return (
        <View style={[styles.outerFrame, { width: cardWidth, borderColor: colors.accent }]}>
            <View style={[styles.innerCard, { backgroundColor: colors.accent + 'BE' }]}>
                <View style={styles.topBar}>
                    <Text style={styles.pokeName} numberOfLines={1}>{pokemon.nome}</Text>
                    <Text style={styles.pokeIndex}>#{pokemon.index}</Text>
                </View>

                <View style={styles.imageWrapper}>
                    <Image source={{ uri: pokemon.imagem }} style={styles.pokemonImage} resizeMode="contain" />
                </View>

                <View style={styles.typesRow}>
                    {ptTypes.map(t => (
                        <View key={t} style={styles.typePill}>
                            <Text style={styles.typeEmoji}>{TYPE_ICONS[t] ?? '⭐'}</Text>
                            <Text style={styles.typeLabel}>{t.slice(0, 3)}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}