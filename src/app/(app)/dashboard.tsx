import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button } from '../../components/button';
import { List } from '../../components/list';
import { useAuth } from '../../context/AuthContext';

// Importando nossa const unificada (supondo que esteja em um arquivo Theme.ts)
import { Theme } from '../../styles/theme'; 

export default function Dashboard() {
    const { user, signOut } = useAuth();

    // Dados atualizados para o tema Pokémon
    const pokemonData = [
        { id: '1', name: 'Charmander', type: 'fire', description: 'Nº 0004 - Prefere coisas quentes.' },
        { id: '2', name: 'Squirtle', type: 'water', description: 'Nº 0007 - Esconde-se em sua concha.' },
        { id: '3', name: 'Bulbasaur', type: 'grass', description: 'Nº 0001 - Carrega uma semente nas costas.' },
    ];

    return (
        <View style={Theme.styles.container}>
            {/* Header com estilo Dark */}
            <View style={{ marginBottom: 24, gap: 8 }}>
                <Text style={[Theme.styles.pokemonName, { fontSize: 16, color: Theme.colors.textSecondary }]}>
                    Treinador:
                </Text>
                <Text style={Theme.styles.pokemonName}>
                    {user || 'Ash Ketchum'}
                </Text>
                <Button 
                    title="Sair da APP" 
                    onPress={signOut} 
                    // Se o seu componente Button aceitar estilo, podemos passar o vermelho
                    style={{ backgroundColor: Theme.colors.primaryRed, marginTop: 8 }} 
                />
            </View>

            <List
                data={pokemonData}
                onLoadMore={() => {}}
                renderItemContent={(item) => {
            // Busca a cor baseado no tipo, com fallback para grass caso não encontre
                  const typeKey = item.type as keyof typeof Theme.colors.types;
                  const typeInfo = Theme.colors.types[typeKey] || Theme.colors.types.grass;

                return (
                    <View style={Theme.styles.card}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                       <Text style={Theme.styles.pokemonName}>{item.name}</Text>
                
                      <View style={[
                          Theme.styles.badge, 
                          { borderColor: typeInfo.color, backgroundColor: typeInfo.bg }
                     ]}>
                    <Text style={[Theme.styles.badgeText, { color: typeInfo.color }]}>
                        {item.type}
                    </Text>
                </View>
            </View>

            <Text style={{ color: Theme.colors.textSecondary, lineHeight: 20, marginTop: 8 }}>
                {item.description}
                 </Text>

                   <View style={{ height: 2, backgroundColor: typeInfo.color, width: '30%', borderRadius: 1, marginTop: 12 }} />
                      </View>
                     );
                }}
            />
        </View>
    );
}