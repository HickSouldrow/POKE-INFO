import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pokemon } from "@/@types/pokemon";

type UserCredentials = {
    name: string;
    email: string;
    team: Pokemon[];
    availablePokemons: Pokemon[]; // Nova lista fixa salva por usuário
};

type AuthContextData = {
    isAuthenticated: boolean;
    user: UserCredentials | null;
    isLoading: boolean;
    signIn: (usernameOrEmail: string, senha: string) => Promise<void>;
    signUp: (name: string, email: string, senha: string) => Promise<void>;
    signOut: () => Promise<void>;
    addToTeam: (pokemon: Pokemon) => Promise<void>;
    removeFromTeam: (pokemonIndex: number) => Promise<void>;
    setInitialExplorationList: (pokemons: Pokemon[]) => Promise<void>; // Registra a primeira lista
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<UserCredentials | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadStorageData() {
            const storageUser = await AsyncStorage.getItem('@Auth:loggedUser');
            if (storageUser) {
                setUser(JSON.parse(storageUser));
                setIsAuthenticated(true);
            }
            setIsLoading(false);
        }
        loadStorageData();
    }, []);
    
    async function updateGlobalUserData(updatedUser: UserCredentials) {
        setUser(updatedUser);
        await AsyncStorage.setItem('@Auth:loggedUser', JSON.stringify(updatedUser));

        const storageUsers = await AsyncStorage.getItem('@Auth:registeredUsers');
        if (storageUsers) {
            const usersList: any[] = JSON.parse(storageUsers);
            const updatedList = usersList.map(u => 
                u.email.toLowerCase() === updatedUser.email.toLowerCase() 
                    ? { ...u, team: updatedUser.team, availablePokemons: updatedUser.availablePokemons } 
                    : u
            );
            await AsyncStorage.setItem('@Auth:registeredUsers', JSON.stringify(updatedList));
        }
    }

    async function signIn(usernameOrEmail: string, responseSenha: string) {
        const storageUsers = await AsyncStorage.getItem('@Auth:registeredUsers');
        const usersList: any[] = storageUsers ? JSON.parse(storageUsers) : [];

        const foundUser = usersList.find(
            (u) => (u.name.toLowerCase() === usernameOrEmail.toLowerCase() || 
                    u.email.toLowerCase() === usernameOrEmail.toLowerCase()) && 
                    u.senha === responseSenha
        );

        if (!foundUser) {
            throw new Error("Usuário ou senha inválidos.");
        }

        const loggedUser: UserCredentials = {
            name: foundUser.name,
            email: foundUser.email,
            team: foundUser.team || [],
            availablePokemons: foundUser.availablePokemons || [] // Recupera a lista fixa do usuário
        };

        setUser(loggedUser);
        setIsAuthenticated(true);
        await AsyncStorage.setItem('@Auth:loggedUser', JSON.stringify(loggedUser));
    }

    async function signUp(name: string, email: string, senha: string) {
        const storageUsers = await AsyncStorage.getItem('@Auth:registeredUsers');
        const usersList: any[] = storageUsers ? JSON.parse(storageUsers) : [];

        const emailExists = usersList.some((u) => u.email.toLowerCase() === email.toLowerCase());
        if (emailExists) {
            throw new Error("Este e-mail já está cadastrado.");
        }

        const newUser = {
            name,
            email,
            senha,
            team: [],
            availablePokemons: [] // Começa vazio, o Dashboard irá popular na primeira abertura
        };

        usersList.push(newUser);
        await AsyncStorage.setItem('@Auth:registeredUsers', JSON.stringify(usersList));
    }

    // Define de forma definitiva a lista de exploração gerada na criação da conta
    async function setInitialExplorationList(pokemons: Pokemon[]) {
        if (!user || user.availablePokemons.length > 0) return;
        await updateGlobalUserData({ ...user, availablePokemons: pokemons });
    }

    async function addToTeam(pokemon: Pokemon) {
        if (!user) return;
        
        const alreadyInTeam = user.team.some(p => p.index === pokemon.index);
        if (alreadyInTeam) throw new Error("Este Pokémon já está no seu time!");

        if (user.team.length >= 6) {
            throw new Error("Seu time já está cheio (máximo 6 Pokémon)!");
        }

        const updatedTeam = [...user.team, pokemon];
        await updateGlobalUserData({ ...user, team: updatedTeam });
    }

    async function removeFromTeam(pokemonIndex: number) {
        if (!user) return;

        const updatedTeam = user.team.filter(p => p.index !== pokemonIndex);
        await updateGlobalUserData({ ...user, team: updatedTeam });
    }

    async function signOut() {
        setUser(null);
        setIsAuthenticated(false);
        await AsyncStorage.removeItem('@Auth:loggedUser');
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, signIn, signUp, signOut, addToTeam, removeFromTeam, setInitialExplorationList, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);