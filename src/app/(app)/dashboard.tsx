import { View, Text, Image } from 'react-native';
import { Button } from '../../components/button';
import { List } from '../../components/list';
import { useAuth } from '../../context/AuthContext';
import { Theme } from '../../styles/theme';

export default function Dashboard() {
    const { user, signOut } = useAuth();

    const pokemonData = [
        { id: '260', name: 'Swampert', types: ['water', 'ground'], description: 'Nº 0260 - Possui força suficiente para arrastar uma pedra de mais de uma tonelada.' },
        { id: '282', name: 'Gardevoir', types: ['psychic', 'fairy'], description: 'Nº 0282 - Tem a capacidade de prever o futuro e protege seu treinador com a própria vida.' },
        { id: '286', name: 'Breloom', types: ['grass', 'fighting'], description: 'Nº 0286 - Espalha esporos venenosos e ataca com socos rápidos que são invisíveis.' },
        { id: '310', name: 'Manectric', types: ['electric'], description: 'Nº 0310 - Cria nuvens de trovoada acima de sua cabeça e descarrega eletricidade.' },
        { id: '330', name: 'Flygon', types: ['ground', 'dragon'], description: 'Nº 0330 - Conhecido como o "Espírito do Deserto", sua batida de asas soa como música.' },
        { id: '306', name: 'Aggron', types: ['steel', 'rock'], description: 'Nº 0306 - Reivindica uma montanha inteira como seu território e a protege ferozmente.' },
    ];

    const pokemonImages: { [key: string]: any } = {
        '260': require('../../../assets/images/260.png'),
        '282': require('../../../assets/images/282.png'),
        '286': require('../../../assets/images/286.png'),
        '310': require('../../../assets/images/310.png'),
        '330': require('../../../assets/images/330.png'),
        '306': require('../../../assets/images/306.png'),
    };

    return (
        <View style={Theme.styles.container}>
            <View style={{ marginBottom: 24, marginTop: 20 }}>
                <Text style={[Theme.styles.pokemonName, { fontSize: 14, color: Theme.colors.textSecondary }]}>
                    Treinador logado
                </Text>
                <Text style={[Theme.styles.pokemonName, { color: Theme.colors.white, fontSize: 20 }]}>
                    {user || 'Ash Ketchum'}
                </Text>
                
                <View style={Theme.styles.divider} />

                <Button 
                    title="Sair da Pokedéx" 
                    onPress={signOut} 
                    style={{ 
                        borderColor: Theme.colors.primaryRed,
                        borderWidth: 1,
                        marginTop: 8,
                        height: 40
                    }} 
                />
            </View>

            <List
                data={pokemonData}
                onLoadMore={() => {}}
                renderItemContent={(item) => {
                    const primaryType = item.types[0] as keyof typeof Theme.colors.types;
                    const typeInfo = Theme.colors.types[primaryType] || Theme.colors.types.grass;

                    return (
                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, position: 'relative' }}>
                            
                            <View style={{ position: 'absolute', top: 0, right: 0, flexDirection: 'row', gap: 4, zIndex: 10 }}>
                                {item.types.map((t: string) => {
                                    const tInfo = Theme.colors.types[t as keyof typeof Theme.colors.types] || Theme.colors.types.grass;
                                    return (
                                        <View key={t} style={[
                                            Theme.styles.badge, 
                                            { 
                                                borderColor: tInfo.color, 
                                                backgroundColor: tInfo.bg, 
                                                paddingHorizontal: 8,
                                                borderWidth: 1.5 
                                            }
                                        ]}>
                                            <Text style={[Theme.styles.badgeText, { color: tInfo.color, fontSize: 9 }]}>
                                                {t}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>

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
                                elevation: 5
                            }}>
                                <Image 
                                    source={pokemonImages[item.id]} 
                                    style={{ width: 100, height: 100 }}
                                    resizeMode="contain"
                                />
                            </View>

                            <View style={{ flex: 1, justifyContent: 'center' }}>
                                <Text style={[Theme.styles.pokemonName, { fontSize: 20, marginBottom: 4, marginTop: 8 }]}>
                                    {item.name}
                                </Text>

                                <Text style={{ color: Theme.colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 10 }} numberOfLines={3}>
                                    {item.description}
                                </Text>

                                <View style={{ 
                                    height: 4, 
                                    backgroundColor: typeInfo.color, 
                                    width: '100%', 
                                    borderRadius: 2, 
                                    shadowColor: typeInfo.color,
                                    shadowOpacity: 1,
                                    shadowRadius: 6,
                                    elevation: 6
                                }} />
                            </View>
                        </View>
                    );
                }}
            />
        </View>
    );
}