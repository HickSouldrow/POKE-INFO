import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, useWindowDimensions, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { PokeballLoading } from '@/components/pokeball-loading';
import { getPokemons } from '@/integration/pokemonIntegration';
import { Pokemon, Poder } from '@/@types/pokemon';
import { TYPE_MAP, TYPE_ICONS, Colors, getColor } from '@/constants/pokemonTypes';
import { styles } from '../(app)/dashboard.styles';

// IMPORTAÇÕES DOS COMPONENTES
import { Header } from '@/components/header/header'; 
import PokedexCompleta from './pokedex';    
import Perfil from './profile'; 

const STAT_ABBR: Record<string, string> = {
    hp: 'HP', attack: 'ATK', defense: 'DEF',
    'special-attack': 'SP.A', 'special-defense': 'SP.D', speed: 'SPD',
};

const mapType = (t: string) => TYPE_MAP[t] ?? 'normal';
const CARD_GAP = 12;
const GRID_H_PAD = 16;
const MY_TEAM_SIZE = 5;     
const POKEDEX_SIZE = 25;    

export default function Dashboard() {
    const { user, signOut } = useAuth();
    const { width } = useWindowDimensions();
    const [loading, setLoading] = useState(true);
    const [myTeam, setMyTeam] = useState<Pokemon[]>([]);
    const [randomPokemons, setRandomPokemons] = useState<Pokemon[]>([]);
    
    // CORREÇÃO: Estados separados corretamente para controlar a navegação local
    const [verPokedex, setVerPokedex] = useState(false);
    const [verPerfil, setVerPerfil] = useState(false);

    const cardWidth = Math.floor((width - GRID_H_PAD * 4 - CARD_GAP) / 5);

    useEffect(() => {
        let isMounted = true;
        
        async function load() {
            try {
                const all = await getPokemons(151);
                
                if (isMounted) {
                    const shuffled = [...all].sort(() => Math.random() - 0.5);
                    setMyTeam(shuffled.slice(0, MY_TEAM_SIZE));
                    setRandomPokemons(shuffled.slice(MY_TEAM_SIZE, MY_TEAM_SIZE + POKEDEX_SIZE));
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
    }, []);

    // CORREÇÃO: Renderizações condicionais limpas e sem erros de chaves
    if (verPokedex) {
        return <PokedexCompleta onBack={() => setVerPokedex(false)} />;
    }

    if (verPerfil) {
        return <Perfil onBack={() => setVerPerfil(false)} />;
    }

    return (
        <View style={styles.wrapper}>
            {/* Header Componentizado - Linkagens injetadas corretamente nas propriedades */}
            <Header 
                user={user} 
                onSignOut={signOut} 
                onPokedexPress={() => setVerPokedex(true)} 
                onProfilePress={() => setVerPerfil(true)} 
            />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Seção: Meu Time */}
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionAccent} />
                    <Text style={styles.sectionTitle}>MEU TIME</Text>
                    <Text style={styles.sectionSubText}>{myTeam.length} ATIVOS</Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedList}>
                    {myTeam.map(pokemon => <MyTeamCard key={pokemon.index} pokemon={pokemon} />)}
                </ScrollView>

                {/* Seção: Explorar */}
                <View style={[styles.sectionHeader, styles.sectionHeaderList]}>
                    <View style={styles.sectionAccent} />
                    <Text style={styles.sectionTitle}>EXPLORAR</Text>
                    <Text style={styles.sectionSubText}>{POKEDEX_SIZE} DISPONÍVEIS</Text>
                </View>

                <View style={[styles.grid, { paddingHorizontal: GRID_H_PAD, gap: CARD_GAP }]}>
                    {randomPokemons.map(pokemon => <PokemonGridCard key={pokemon.index} pokemon={pokemon} cardWidth={cardWidth} />)}
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Overlay de carregamento */}
            {loading && (
                <View style={styles.overlayFullscreen}>
                    <PokeballLoading />
                </View>
            )}
        </View>
    );
}

function MyTeamCard({ pokemon }: { pokemon: Pokemon }) {
    const ptTypes = pokemon.tipos.map(mapType);
    const colors = getColor(ptTypes);
    const hp = pokemon.poderes.find(p => p.nome === 'hp')?.forca ?? 0;

    return (
        <View style={[styles.myTeamCard, { borderColor: colors.accent, shadowColor: Colors.primaryRed }]}>
            <View style={[styles.shimmerStrip, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]} />
            <View style={[styles.innerCard, { backgroundColor: colors.accent + 'D0' }]}>
                <View style={[styles.topBar, { backgroundColor: 'rgba(0,0,0,0.15)', borderBottomColor: 'rgba(0,0,0,0.2)' }]}>
                    <Text style={[styles.pokeName, { color: '#FFF' }]} numberOfLines={1}>{pokemon.nome}</Text>
                    <View style={styles.hpRow}>
                        <Text style={[styles.hpLabel, { color: 'rgba(255,255,255,0.8)' }]}>HP</Text>
                        <Text style={[styles.hpValue, { color: '#FFF' }]}>{hp}</Text>
                    </View>
                </View>
                <View style={[styles.imageWrapper, styles.myTeamImageWrapper, { borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <View style={[styles.cornerTL, { borderColor: '#FFF' }]} />
                    <View style={[styles.cornerBR, { borderColor: '#FFF' }]} />
                    <Image source={{ uri: pokemon.imagem }} style={styles.myTeamImage} resizeMode="contain" />
                </View>
            </View>
            <View style={[styles.glowRing, { borderColor: colors.accent }]} />
        </View>
    );
}

function PokemonGridCard({ pokemon, cardWidth }: { pokemon: Pokemon; cardWidth: number }) {
    const ptTypes = pokemon.tipos.map(mapType);
    const colors = getColor(ptTypes);
    const hp = pokemon.poderes.find(p => p.nome === 'hp')?.forca ?? 0;

    return (
        <View style={[styles.outerFrame, { width: cardWidth, borderColor: colors.accent, shadowColor: colors.accent }]}>
            <View style={[styles.shimmerStrip, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]} />
            <View style={[styles.innerCardStatic, { backgroundColor: colors.accent + 'CC' }]}>
                <View style={[styles.topBar, { backgroundColor: 'rgba(0,0,0,0.12)', borderBottomColor: 'rgba(0,0,0,0.15)' }]}>
                    <Text style={[styles.pokeName, { color: '#FFF' }]} numberOfLines={1}>{pokemon.nome}</Text>
                    <View style={styles.hpRow}>
                        <Text style={[styles.hpLabel, { color: 'rgba(255,255,255,0.7)' }]}>HP</Text>
                        <Text style={[styles.hpValue, { color: '#FFF' }]}>{hp}</Text>
                    </View>
                </View>

                <View style={[styles.imageWrapper, { borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                    <View style={[styles.cornerTL, { borderColor: '#FFF' }]} />
                    <View style={[styles.cornerBR, { borderColor: '#FFF' }]} />
                    <Image source={{ uri: pokemon.imagem }} style={styles.pokemonImage} resizeMode="contain" />
                </View>

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
            <View style={[styles.glowRing, { borderColor: 'rgba(255,255,255,0.3)' }]} />
        </View>
    );
}