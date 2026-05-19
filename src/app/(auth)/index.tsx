import { useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../../assets/images/logo.png';

import { View, Text, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Button } from '../../components/button';
import { Input } from '../../components/input';
import { Card } from '../../components/card';
import { Alert } from '../../components/alert'; 
import { Theme } from '../../constants/theme'; 

export default function Index() {
    const [name, setName] = useState<string>('');
    const [senha, setSenha] = useState<string>('');
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertData, setAlertData] = useState({ 
        title: '', 
        message: '',
        type: 'success' as 'success' | 'error' | 'warning' | 'info',
    });

    const { signIn } = useAuth();

    async function validateCredentials() {
        // Usando a "nossa senha" admin/123456 do AuthContext
        try {
            await signIn(name);
            router.push({
                pathname: '/dashboard',
                params: { username: name } 
            });
        } catch {
            setAlertData({
                title: 'Acesso Negado',
                message: 'Treinador não encontrado ou senha incorreta.',
                type: 'error',
            });
            setIsAlertVisible(true);
        }
    }

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={Theme.styles.container}
        >
            <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
                <Card>
                    <Image 
                        source={Logo} 
                        style={{ width: 280, height: 100, alignSelf: 'center', marginBottom: 20 }} 
                        resizeMode="contain"
                    />
                    
                    <Text style={[Theme.styles.pokemonName, { fontSize: 16, textAlign: 'center', marginBottom: 20 }]}>
                        Painel de Controle
                    </Text>

                    <View style={{ gap: 16 }}>
                        <Input 
                            placeholder="Usuário" 
                            placeholderTextColor="#A8A29E"
                            onChangeText={setName}
                            autoCapitalize="none"
                        />
                        <Input 
                            placeholder="Senha" 
                            placeholderTextColor="#A8A29E"
                            secureTextEntry 
                            onChangeText={setSenha} />
                        
                        <Button 
                            title="Entrar no Sistema" 
                            onPress={validateCredentials} 
                            style={{ marginTop: 10 }}
                        />
                    </View>
                </Card>
            </View>

            <Alert 
                title={alertData.title}
                message={alertData.message}
                type={alertData.type}
                visible={isAlertVisible}
                onClose={() => setIsAlertVisible(false)}
            />
        </KeyboardAvoidingView>
    );
}