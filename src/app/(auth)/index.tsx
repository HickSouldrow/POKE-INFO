import { useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../../assets/images/logo.png';

import { View, Text, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Pressable } from 'react-native';
import { Button } from '../../components/button';
import { Input } from '../../components/input';
import { Card } from '../../components/card';
import { Alert } from '../../components/alert'; 
import { Theme } from '../../constants/theme'; 

export default function Index() {
    const [name, setName] = useState<string>('');
    const [senha, setSenha] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertData, setAlertData] = useState({ 
        title: '', 
        message: '',
        type: 'success' as 'success' | 'error' | 'warning' | 'info',
    });

    const { signIn } = useAuth();

    async function validateCredentials() {
        if (!name.trim() || !senha.trim()) {
            setAlertData({
                title: 'Campos Vazios',
                message: 'Por favor, preencha o usuário e a senha.',
                type: 'warning',
            });
            setIsAlertVisible(true);
            return;
        }

        setIsLoading(true);

        try {
            await signIn(name, senha); 
            
            router.push({
                pathname: '/dashboard',
                params: { username: name } 
            });
        } catch (error: any) {
            setAlertData({
                title: 'Acesso Negado',
                message: error?.message || 'Usuário não encontrado ou senha incorreta.',
                type: 'error',
            });
            setIsAlertVisible(true);
        } finally {
            setIsLoading(false);
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
                            placeholder="Usuário ou E-mail" 
                            placeholderTextColor="#A8A29E"
                            onChangeText={setName}
                            value={name}
                            autoCapitalize="none"
                        />
                        <Input 
                            placeholder="Senha" 
                            placeholderTextColor="#A8A29E"
                            secureTextEntry 
                            onChangeText={setSenha} 
                            value={senha}
                        />
                        
                        <Button 
                            title={isLoading ? "" : "Entrar no Sistema"} 
                            onPress={validateCredentials} 
                            disabled={isLoading}
                            style={{ marginTop: 10 }}
                        >
                            {isLoading && <ActivityIndicator color="#FFF" />}
                        </Button>

                        {/* LINK PARA A TELA DE CADASTRO */}
                        <Pressable onPress={() => router.push('/register')} style={{ marginTop: 10 }}>
                            <Text style={{ color: '#EF4444', textAlign: 'center', fontWeight: 'bold' }}>
                                Não tem uma conta? Cadastre-se
                            </Text>
                        </Pressable>
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