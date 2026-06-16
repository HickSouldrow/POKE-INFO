import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Pokemon, Poder } from '@/@types/pokemon';
import { Pokeball } from '@/components/pokeball';
import { TYPE_MAP, TYPE_ICONS, getColor } from '@/constants/pokemonTypes';
import { Colors } from '@/constants/theme';

const mapType = (t: string) => TYPE_MAP[t] ?? 'normal';

const STAT_ABBR: Record<string, string> = {
  hp: 'HP', attack: 'ATK', defense: 'DEF',
  'special-attack': 'SP.A', 'special-defense': 'SP.D', speed: 'SPD',
};

type Props = {
  visible: boolean;
  pokemon: Pokemon | null;
  statusMessage?: string | null;
  onClose: () => void;
};

// Modal de captura: a Pokébola "chacoalha" e em seguida revela o Pokémon obtido na batalha
export default function NewPokemonReveal({ visible, pokemon, statusMessage, onClose }: Props) {
  const [phase, setPhase] = useState<'shaking' | 'revealed'>('shaking');

  const ballRotation = useSharedValue(0);
  const ballScale = useSharedValue(1);
  const ballOpacity = useSharedValue(1);
  const flashOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.4);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible || !pokemon) return;

    setPhase('shaking');
    ballRotation.value = 0;
    ballScale.value = 1;
    ballOpacity.value = 1;
    flashOpacity.value = 0;
    cardScale.value = 0.4;
    cardOpacity.value = 0;

    ballRotation.value = withSequence(
      withTiming(-18, { duration: 150, easing: Easing.out(Easing.quad) }),
      withTiming(18, { duration: 150, easing: Easing.inOut(Easing.quad) }),
      withTiming(-14, { duration: 150, easing: Easing.inOut(Easing.quad) }),
      withTiming(14, { duration: 150, easing: Easing.inOut(Easing.quad) }),
      withTiming(0, { duration: 120, easing: Easing.out(Easing.quad) })
    );

    ballScale.value = withDelay(750, withTiming(0, { duration: 220, easing: Easing.in(Easing.quad) }));
    ballOpacity.value = withDelay(
      750,
      withTiming(0, { duration: 220 }, () => {
        runOnJS(setPhase)('revealed');
      })
    );

    flashOpacity.value = withDelay(
      760,
      withSequence(withTiming(1, { duration: 120 }), withTiming(0, { duration: 350 }))
    );

    cardOpacity.value = withDelay(820, withTiming(1, { duration: 250 }));
    cardScale.value = withDelay(
      820,
      withSequence(
        withTiming(1.08, { duration: 220, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) })
      )
    );
  }, [visible, pokemon]);

  const ballStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ballRotation.value}deg` }, { scale: ballScale.value }],
    opacity: ballOpacity.value,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  if (!pokemon) return null;

  const ptTypes = pokemon.tipos.map(mapType);
  const colors = getColor(ptTypes);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.flash, flashStyle]} pointerEvents="none" />

        <Animated.View style={[styles.ballWrapper, ballStyle]} pointerEvents="none">
          <Pokeball size={96} />
        </Animated.View>

        {phase === 'revealed' && (
          <Animated.View style={[styles.card, { borderColor: colors.accent, shadowColor: colors.accent }, cardStyle]}>
            <View style={[styles.cardHeader, { backgroundColor: colors.accent }]}>
              <Text style={styles.title}>POKÉMON SELVAGEM CAPTURADO!</Text>
            </View>

            <View style={[styles.imageWrapper, { backgroundColor: colors.accent + '33', borderColor: colors.accent }]}>
              <Image source={{ uri: pokemon.imagem }} style={styles.image} resizeMode="contain" />
            </View>

            <Text style={styles.name}>{pokemon.nome}</Text>
            <Text style={styles.indexNumber}>#{pokemon.index}</Text>

            <View style={styles.typesRow}>
              {ptTypes.map(t => (
                <View key={t} style={[styles.typePill, { backgroundColor: colors.accent + '40', borderColor: colors.accent }]}>
                  <Text style={styles.typeEmoji}>{TYPE_ICONS[t] ?? '⭐'}</Text>
                  <Text style={styles.typeLabel}>{t}</Text>
                </View>
              ))}
            </View>

            <View style={styles.statsSection}>
              {pokemon.poderes.map((poder: Poder) => (
                <View key={poder.nome} style={styles.statRow}>
                  <Text style={styles.statName}>
                    {STAT_ABBR[poder.nome] ?? poder.nome.slice(0, 4).toUpperCase()}
                  </Text>
                  <View style={styles.statBarBg}>
                    <View
                      style={[
                        styles.statBarFill,
                        { width: `${Math.min((poder.forca / 150) * 100, 100)}%`, backgroundColor: colors.accent },
                      ]}
                    />
                  </View>
                  <Text style={styles.statValue}>{poder.forca}</Text>
                </View>
              ))}
            </View>

            {!!statusMessage && <Text style={styles.statusMessage}>{statusMessage}</Text>}

            <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.accent }]} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeButtonText}>OK</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  ballWrapper: {
    position: 'absolute',
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  cardHeader: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  imageWrapper: {
    width: 140,
    height: 140,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  image: {
    width: 110,
    height: 110,
  },
  name: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    textTransform: 'capitalize',
    letterSpacing: 0.5,
  },
  indexNumber: {
    color: Colors.whiteAlpha['50'],
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
  },
  typesRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeEmoji: {
    fontSize: 11,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsSection: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 6,
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statName: {
    width: 38,
    color: Colors.whiteAlpha['50'],
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statValue: {
    width: 28,
    textAlign: 'right',
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  statusMessage: {
    color: Colors.whiteAlpha['50'],
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  closeButton: {
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
});
