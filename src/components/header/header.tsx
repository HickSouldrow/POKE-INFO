import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/pokemonTypes';
import { useAuth } from '@/context/AuthContext';
import { styles } from '../../app/(app)/dashboard.styles';

// Criamos uma tipagem para a estrutura de objeto do usuário
type UserObject = {
    name: string;
    email?: string;
};

type HeaderProps = {
    // Agora o user aceita o Objeto Novo, a String Antiga ou Null
    user: UserObject | string | null;
    onSignOut: () => void;
    onProfilePress: () => void;
    onPokedexPress: () => void;
};

/** Segundos -> "mm:ss" (ou "hh:mm" quando ainda falta mais de uma hora). */
function formatRemaining(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (value: number) => String(value).padStart(2, '0');
    return hours > 0 ? `${pad(hours)}:${pad(minutes)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export function Header({ user, onSignOut, onPokedexPress, onProfilePress }: HeaderProps) {
    const { sessionExpiresIn, isSecureChannelActive } = useAuth();

    // Menos de 5 minutos para a sessão cair: destaca o contador em vermelho.
    const isExpiringSoon = sessionExpiresIn > 0 && sessionExpiresIn <= 300;

    // Tratamento seguro para extrair o nome do treinador
    const getTrainerName = (): string => {
        if (!user) return 'Ash Ketchum';
        if (typeof user === 'object' && 'name' in user) {
            return user.name;
        }
        return String(user); // Caso ainda venha como string simples em algum teste
    };

    const trainerName = getTrainerName();
    
    // Pega a primeira letra de forma 100% segura
    const primeiraLetra = trainerName && trainerName.length > 0 ? trainerName[0].toUpperCase() : 'A';

    return (
        <View style={styles.profileHeader}>
            <View style={styles.userInfo}>
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{primeiraLetra}</Text>
                </View>
                <View>
                    <Text style={styles.profileSub}>Treinador</Text>
                    <Text style={styles.profileName}>{trainerName}</Text>
                    {sessionExpiresIn > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <Text
                                style={{
                                    fontSize: 10,
                                    fontWeight: '700',
                                    color: isExpiringSoon ? '#FCA5A5' : 'rgba(255,255,255,0.55)',
                                }}
                            >
                                {isSecureChannelActive ? '🔒' : '🔑'} sessão {formatRemaining(sessionExpiresIn)}
                            </Text>
                        </View>
                    )}
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