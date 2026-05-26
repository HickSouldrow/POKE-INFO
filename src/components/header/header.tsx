import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/pokemonTypes';
import { styles } from '../../app/(app)/dashboard.styles';

type HeaderProps = {
    user: string | null;
    onSignOut: () => void;
    onProfilePress: () => void;
    onPokedexPress: () => void;
};

export function Header({ user, onSignOut, onPokedexPress, onProfilePress }: HeaderProps) {
    return (
        <View style={styles.profileHeader}>
            <View style={styles.userInfo}>
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{(user || 'A')[0].toUpperCase()}</Text>
                </View>
                <View>
                    <Text style={styles.profileSub}>Treinador</Text>
                    <Text style={styles.profileName}>{user || 'Ash Ketchum'}</Text>
                </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TouchableOpacity 
                    style={[styles.logoutButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: Colors.whiteAlpha?.['30'] || 'rgba(255,255,255,0.3)' }]} 
                    onPress={onPokedexPress} 
                    activeOpacity={0.7}
                >
                <Text style={[styles.logoutText, { color: '#FFF' }]}>Pokédex</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.logoutButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: Colors.whiteAlpha?.['30'] || 'rgba(255,255,255,0.3)' }]} 
                    onPress={onProfilePress} 
                    activeOpacity={0.7}
                >

                <Text style={[styles.logoutText, { color: '#FFF' }]}>Perfil</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.logoutButton} onPress={onSignOut} activeOpacity={0.7}>
                    <Text style={styles.logoutText}>Sair</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}