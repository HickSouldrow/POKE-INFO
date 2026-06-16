import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, useWindowDimensions, Image, TouchableOpacity, Alert as RNAlert, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { PokeballLoading } from '@/components/pokeball-loading';
import { getPokemons, getRandomPokemon } from '@/integration/pokemonIntegration';
import { Pokemon, Poder } from '@/@types/pokemon';
import { TYPE_MAP, TYPE_ICONS, Colors, getColor } from '@/constants/pokemonTypes';
import { styles } from '../(app)/dashboard.styles';

// IMPORTAÇÕES DOS COMPONENTES
import { Header } from '@/components/header/header';
import PokedexCompleta from './pokedex';
import Perfil from './profile';
import NewPokemonReveal from './new_Pokemon';

const STAT_ABBR: Record<string, string> = {
    hp: 'HP', attack: 'ATK', defense: 'DEF',
    'special-attack': 'SP.A', 'special-defense': 'SP.D', speed: 'SPD',
};

const mapType = (t: string) => TYPE_MAP[t] ?? 'normal';
const CARD_GAP = 12;
const GRID_H_PAD = 16;
const POKEDEX_SIZE = 30;    

export default function Dashboard() {
    const { user, signOut, addToTeam, removeFromTeam, setInitialExplorationList } = useAuth();
    const { width } = useWindowDimensions();
    const [loading, setLoading] = useState(true);
    
    const [verPokedex, setVerPokedex] = useState(false);
    const [verPerfil, setVerPerfil] = useState(false);

    // Estado do botão de Batalha (geração de Pokémon aleatório via PokéAPI)
    const [battling, setBattling] = useState(false);
    const [battlePokemon, setBattlePokemon] = useState<Pokemon | null>(null);
    const [battleVisible, setBattleVisible] = useState(false);
    const [battleStatus, setBattleStatus] = useState<string | null>(null);

    // Web tem espaço para 5 cards por linha; no Android/mobile mostramos menos
    // (2 colunas) para que cada card fique legível em telas estreitas.
    const columns = Platform.OS === 'web' ? 5 : 2;
    const cardWidth = Math.floor((width - GRID_H_PAD * 2 - CARD_GAP * (columns - 1)) / columns);

    // Mapeamento em tempo real do estado global de dados do usuário
    const myTeam = user?.team || [];
    const randomPokemons = user?.availablePokemons || [];

    useEffect(() => {
        let isMounted = true;
        
        async function load() {
            try {
                // Se o usuário já tiver Pokémons salvos no feed do "Explorar", pula a geração aleatória
                if (user?.availablePokemons && user.availablePokemons.length > 0) {
                    setLoading(false);
                    return;
                }

                const all = await getPokemons(151);
                if (isMounted) {
                    const shuffled = [...all].sort(() => Math.random() - 0.5);
                    const initialList = shuffled.slice(0, POKEDEX_SIZE);
                    
                    // Salva de forma permanente no perfil deste usuário específico
                    await setInitialExplorationList(initialList);
                }
            } catch (e) {
                console.error(e);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }
        
        load();
        
        return () => {
            isMounted = false;
        };
    }, [user?.availablePokemons]);

    async function handleAddToTeam(pokemon: Pokemon) {
        try {
            await addToTeam(pokemon);
        } catch (error: any) {
            RNAlert.alert("Gerenciar Time", error.message || "Erro ao adicionar.");
        }
    }

    async function handleRemoveFromTeam(pokemonIndex: number) {
        try {
            await removeFromTeam(pokemonIndex);
        } catch (error: any) {
            RNAlert.alert("Gerenciar Time", "Erro ao remover.");
        }
    }

    // Botão de Batalha: busca um Pokémon aleatório na PokéAPI, exibe a animação
    // de captura e tenta adicioná-lo automaticamente ao time do usuário
    async function handleBattle() {
        if (battling) return;

        try {
            setBattling(true);
            const novoPokemon = await getRandomPokemon();
            setBattlePokemon(novoPokemon);

            try {
                await addToTeam(novoPokemon);
                setBattleStatus('Adicionado ao seu time!');
            } catch (error: any) {
                setBattleStatus(error.message || 'Não foi possível adicionar ao time.');
            }

            setBattleVisible(true);
        } catch (error) {
            RNAlert.alert('Batalha', 'Não foi possível encontrar um Pokémon selvagem. Tente novamente.');
        } finally {
            setBattling(false);
        }
    }

    if (verPokedex) {
        return <PokedexCompleta onBack={() => setVerPokedex(false)} />;
    }

    if (verPerfil) {
        return <Perfil onBack={() => setVerPerfil(false)} />;
    }

    return (
        <View style={styles.wrapper}>
            <Header 
                user={user} 
                onSignOut={signOut} 
                onPokedexPress={() => setVerPokedex(true)} 
                onProfilePress={() => setVerPerfil(true)} 
            />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Seção Centralizada: Meu Time */}
                <View style={[styles.sectionHeader, { alignItems: 'center', justifyContent: 'center' }]}>
                    <View style={[styles.sectionAccent, { alignSelf: 'center', marginBottom: 6 }]} />
                    <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>MEU TIME</Text>
                    <Text style={[styles.sectionSubText, { textAlign: 'center' }]}>{myTeam.length} / 6 ATIVOS</Text>
                </View>

                {/* Container do Time */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: CARD_GAP, paddingHorizontal: GRID_H_PAD, marginVertical: 10 }}>
                    {myTeam.length === 0 ? (
                        <Text style={{ color: '#A8A29E', marginVertical: 20, fontStyle: 'italic' }}>
                            Nenhum Pokémon no seu time. Adicione-os abaixo!
                        </Text>
                    ) : (
                        myTeam.map(pokemon => (
                            <MyTeamCard 
                                key={pokemon.index} 
                                pokemon={pokemon} 
                                onRemove={() => handleRemoveFromTeam(pokemon.index)}
                            />
                        ))
                    )}
                </View>

                {/* Seção Centralizada: Explorar */}
                <View style={[styles.sectionHeader, styles.sectionHeaderList, { alignItems: 'center', justifyContent: 'center', marginTop: 20 }]}>
                    <View style={[styles.sectionAccent, { alignSelf: 'center', marginBottom: 6 }]} />
                    <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>EXPLORAR</Text>
                    <Text style={[styles.sectionSubText, { textAlign: 'center' }]}>{randomPokemons.length} DISPONÍVEIS</Text>
                </View>

                <View style={[styles.grid, { paddingHorizontal: GRID_H_PAD, gap: CARD_GAP }]}>
                    {randomPokemons.map(pokemon => {
                        const isAlreadyInTeam = myTeam.some(p => p.index === pokemon.index);
                        return (
                            <PokemonGridCard 
                                key={pokemon.index} 
                                pokemon={pokemon} 
                                cardWidth={cardWidth} 
                                isInTeam={isAlreadyInTeam}
                                onAction={() => isAlreadyInTeam ? handleRemoveFromTeam(pokemon.index) : handleAddToTeam(pokemon)}
                            />
                        );
                    })}
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {loading && (
                <View style={styles.overlayFullscreen}>
                    <PokeballLoading />
                </View>
            )}

            <TouchableOpacity
                style={styles.battleFab}
                onPress={handleBattle}
                disabled={battling}
                activeOpacity={0.85}
            >
                <Text style={styles.battleFabIcon}>⚔️</Text>
                <Text style={styles.battleFabText}>{battling ? 'BUSCANDO...' : 'BATALHAR'}</Text>
            </TouchableOpacity>

            <NewPokemonReveal
                visible={battleVisible}
                pokemon={battlePokemon}
                statusMessage={battleStatus}
                onClose={() => setBattleVisible(false)}
            />
        </View>
    );
}

function MyTeamCard({ pokemon, onRemove }: { pokemon: Pokemon; onRemove: () => void }) {
    const ptTypes = pokemon.tipos.map(mapType);
    const colors = getColor(ptTypes);
    const hp = pokemon.poderes.find(p => p.nome === 'hp')?.forca ?? 0;

    return (
        <View style={[styles.myTeamCard, { borderColor: colors.accent, shadowColor: Colors.primaryRed }]}>
            <View pointerEvents="none" style={[styles.shimmerStrip, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]} />
            <View style={[styles.innerCard, { backgroundColor: colors.accent + 'D0' }]}>
                <View style={[styles.topBar, { backgroundColor: 'rgba(0,0,0,0.15)', borderBottomColor: 'rgba(0,0,0,0.2)' }]}>
                    <Text style={[styles.pokeName, { color: '#FFF' }]} numberOfLines={1}>{pokemon.nome}</Text>
                    <View style={styles.hpRow}>
                        <Text style={[styles.hpLabel, { color: 'rgba(255,255,255,0.8)' }]}>HP</Text>
                        <Text style={[styles.hpValue, { color: '#FFF' }]}>{hp}</Text>
                    </View>
                </View>
                <View style={[styles.imageWrapper, styles.myTeamImageWrapper, { borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Image source={{ uri: pokemon.imagem }} style={styles.myTeamImage} resizeMode="contain" />
                </View>

                <TouchableOpacity 
                    onPress={onRemove}
                    style={{ backgroundColor: '#EF4444', paddingVertical: 4, alignItems: 'center', borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }}
                >
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>REMOVER</Text>
                </TouchableOpacity>
            </View>
            <View pointerEvents="none" style={[styles.glowRing, { borderColor: colors.accent }]} />
        </View>
    );
}

function PokemonGridCard({ pokemon, cardWidth, isInTeam, onAction }: { pokemon: Pokemon; cardWidth: number; isInTeam: boolean; onAction: () => void }) {
    const ptTypes = pokemon.tipos.map(mapType);
    const colors = getColor(ptTypes);
    const hp = pokemon.poderes.find(p => p.nome === 'hp')?.forca ?? 0;

    return (
        <View style={[styles.outerFrame, { width: cardWidth, borderColor: colors.accent, shadowColor: colors.accent }]}>
            <View pointerEvents="none" style={[styles.shimmerStrip, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]} />
            <View style={[styles.innerCardStatic, { backgroundColor: colors.accent + 'CC' }]}>
                <View style={[styles.topBar, { backgroundColor: 'rgba(0,0,0,0.12)', borderBottomColor: 'rgba(0,0,0,0.15)' }]}>
                    <Text style={[styles.pokeName, { color: '#FFF' }]} numberOfLines={1}>{pokemon.nome}</Text>
                    <View style={styles.hpRow}>
                        <Text style={[styles.hpLabel, { color: 'rgba(255,255,255,0.7)' }]}>HP</Text>
                        <Text style={[styles.hpValue, { color: '#FFF' }]}>{hp}</Text>
                    </View>
                </View>

                <View style={[styles.imageWrapper, { borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                    <Image source={{ uri: pokemon.imagem }} style={styles.pokemonImage} resizeMode="contain" />
                </View>

                <TouchableOpacity 
                    onPress={onAction}
                    style={{
                        backgroundColor: isInTeam ? '#EF4444' : '#10B981',
                        paddingVertical: 6,
                        marginHorizontal: 6,
                        borderRadius: 4,
                        alignItems: 'center',
                        marginBottom: 4
                    }}
                >
                    <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>
                        {isInTeam ? "SOLTAR" : "CONVOCAR"}
                    </Text>
                </TouchableOpacity>

                <View style={[styles.footerRow, { borderTopColor: 'rgba(0,0,0,0.1)' }]}>
                    <View style={styles.typesRow}>
                        {ptTypes.map(t => (
                            <View key={t} style={[styles.typePill, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.4)' }]}>
                                <Text style={styles.typeEmoji}>{TYPE_ICONS[t] ?? '⭐'}</Text>
                                <Text style={[styles.typeLabel, { color: '#FFF' }]}>{t}</Text>
                            </View>
                        ))}
                    </View>
                    <Text style={[styles.indexNumber, { color: 'rgba(255,255,255,0.9)' }]}>#{pokemon.index}</Text>
                </View>

                <View style={[styles.statsSection, { borderTopColor: 'rgba(0,0,0,0.1)', backgroundColor: 'rgba(0,0,0,0.15)' }]}>
                    {pokemon.poderes.map((poder: Poder) => (
                        <View key={poder.nome} style={styles.statRow}>
                            <Text style={[styles.statName, { color: 'rgba(255,255,255,0.7)' }]}>
                                {STAT_ABBR[poder.nome] ?? poder.nome.slice(0, 4).toUpperCase()}
                            </Text>
                            <View style={styles.statBarBg}>
                                <View style={[styles.statBarFill, { width: `${Math.min((poder.forca / 150) * 100, 100)}%`, backgroundColor: '#FFFFFF' }]} />
                            </View>
                            <Text style={[styles.statValue, { color: '#FFF' }]}>{poder.forca}</Text>
                        </View>
                    ))}
                </View>
            </View>
            <View pointerEvents="none" style={[styles.glowRing, { borderColor: 'rgba(255,255,255,0.3)' }]} />
        </View>
    );
}