import { Stack, Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "../../context/AuthContext";
import { Theme } from "../../constants/theme"; 

export default function AppLayout() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={[
                Theme.styles.container, 
                { justifyContent: "center", alignItems: "center" }
            ]}>
                {/* O ActivityIndicator agora brilha no Vermelho Neon do tema */}
                <ActivityIndicator size="large" color={Theme.colors.primaryRed} />
            </View>
        );
    }

    if (!isAuthenticated) {
        return <Redirect href="/" />;
    }

    return (
        <Stack 
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Theme.colors.background }
            }} 
        />
    );
}