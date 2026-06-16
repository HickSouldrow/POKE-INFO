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

export default function Register() {
    const [name, setName] = useState<string>('');
    const [senha, setSenha] = useState<string>('');
    const [confirmarSenha, setConfirmarSenha] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertData, setAlertData] = useState({ 
        title: '', 
        message: '',
        type: 'success' as 'success' | 'error' | 'warning' | 'info',
    });

    const { signUp } = useAuth(); // Certifique-se de adicionar o signUp no seu AuthContext

    async function handleRegister() {
        // 1. Validação de campos vazios
        if (!name.trim() || !senha.trim() || !confirmarSenha.trim()) {
            setAlertData({
                title: 'Campos Vazios',
                message: 'Por favor, preencha todos os campos.',
                type: 'warning',
            });
            setIsAlertVisible(true);
            return;
        }

        // 2. Validação se as senhas batem
        if (senha !== confirmarSenha) {
            setAlertData({
                title: 'Senhas Diferentes',
                message: 'A confirmação de senha não confere.',
                type: 'error',
            });
            setIsAlertVisible(true);
            return;
        }

        setIsLoading(true);

        try {
            // Chama a função do contexto que envia os dados para a API
            if (signUp) {
                await signUp(name, senha);
            }

            setAlertData({
                title: 'Conta Criada!',
                message: 'Sua conta de treinador foi criada com sucesso.',
                type: 'success',
            });
            setIsAlertVisible(true);

            // Redireciona para o Login após 2 segundos
            setTimeout(() => {
                setIsAlertVisible(false);
                router.replace('/'); // Altere para a rota correta do seu login se necessário
            }, 2000);

        } catch (error: any) {
            setAlertData({
                title: 'Erro no Cadastro',
                message: error?.message || 'Não foi possível criar a conta. Tente novamente.',
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
                        style={{ width: 280, height: 80, alignSelf: 'center', marginBottom: 15 }} 
                        resizeMode="contain"
                    />
                    
                    <Text style={[Theme.styles.pokemonName, { fontSize: 16, textAlign: 'center', marginBottom: 15 }]}>
                        Criar Conta de Treinador
                    </Text>

                    <View style={{ gap: 12 }}>
                        <Input
                            placeholder="Nome de Usuário"
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
                        <Input 
                            placeholder="Confirmar Senha" 
                            placeholderTextColor="#A8A29E"
                            secureTextEntry 
                            onChangeText={setConfirmarSenha} 
                            value={confirmarSenha}
                        />
                        
                        <Button 
                            title={isLoading ? "" : "Cadastrar"} 
                            onPress={handleRegister} 
                            disabled={isLoading}
                            style={{ marginTop: 10 }}
                        >
                            {isLoading && <ActivityIndicator color="#FFF" />}
                        </Button>

                        <Pressable onPress={() => router.push('/')} style={{ marginTop: 10 }}>
                            <Text style={{ color: '#EF4444', textAlign: 'center', fontWeight: 'bold' }}>
                                Já tem uma conta? Faça Login
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