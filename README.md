# POKE-INFO | Protótipo - Emerald Edition

![Expo](https://img.shields.io/badge/Maintained%20with-Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

Bem-vindo ao **POKE-INFO**, uma Pokédex futurista desenvolvida com **React Native** e **Expo**.

O time apresentado no Dashboard não é aleatório: são os Pokémon que me acompanharam em uma **run inesquecível de Pokémon Emerald**, sendo, até hoje, o meu time favorito.

---

## Para Rodar o Projeto:

Para preparar o ambiente e instalar todas as dependências necessárias para o funcionamento, execute os comandos abaixo:

```bash
# Instalação de dependências principais (SVG e Storage)
npx expo install react-native-svg
npx expo install @react-native-async-storage/async-storage

# Instalação da CLI e do Core do Expo
npx expo install cli
npm install expo

# Configuração completa do ambiente TypeScript
npx expo install typescript @types/react @types/react-native

# Iniciar o servidor de desenvolvimento
npx expo start
```

---

## Login, sessão e segurança

O processo de autenticação foi reescrito seguindo o desenho do projeto de login usado
como referência (Spring Boot + JWT): **tokens temporários**, renovação automática e um
**canal em JavaScript** por onde os dados da nuvem passam — em vez de HTTP comum com
JSON legível.

### O fluxo

```
 tela de login
      │  usuário + senha (uma única vez, nunca são guardados)
      ▼
 authApi.loginUser ──────────────► nuvem  /auth/v1/login
      │                                  { userId | accessToken, secureChannel }
      │  gera em memória uma chave AES-256 e a envia só nesta chamada
      ▼
 session  ── token de acesso (5 min, só na memória)
           └ token de renovação (8 h, no Keychain/Keystore ou cifrado na web)
      │
      ▼
 cloudClient  ── renova sozinho antes de vencer e a cada 401
               ── assina cada requisição (timestamp + nonce + HMAC)
               ── abre em JavaScript o envelope cifrado que a nuvem devolve
      │
      ▼
 telas recebem o objeto já pronto, em memória
```

### Tokens temporários

| | Token de acesso | Token de renovação |
|---|---|---|
| Validade | 5 min | 8 h |
| Onde fica | só na memória | armazenamento seguro do dispositivo |
| Para que serve | acompanha cada requisição | emitir um par novo |

Vencido o token de renovação, a sessão cai sozinha e o app volta para o login sem
precisar de nenhuma ação — o cabeçalho mostra o tempo restante.

Se o backend devolver `accessToken` (ou `token`, como o projeto Spring), esses são os
tokens oficiais da sessão. Se devolver apenas `userId` — caso do backend atual na AWS —
o app emite localmente tickets no mesmo formato, assinados com uma chave que nasce no
aparelho e nunca sai dele. Trocar o backend é mudar `EXPO_PUBLIC_API_URL`, nada mais.

### Canal seguro: dados da nuvem via JavaScript

Quando o backend confirma a chave enviada no login (`secureChannel: true`), as respostas
chegam como um envelope AES-256-GCM:

```json
{ "v": 1, "alg": "AES-256-GCM", "iv": "bS135Ihq...", "data": "OsSI26kfPqfUpyd7..." }
```

O JSON de verdade só passa a existir depois que o `cloudClient` abre o envelope em
JavaScript. Quem abre a aba Network, repete a URL no curl ou intercepta o tráfego vê o
blob cifrado; e como o GCM autentica o conteúdo, resposta adulterada não abre. Cada
chamada leva ainda `X-Poke-Timestamp`, `X-Poke-Nonce` e `X-Poke-Signature`, o que impede
capturar uma requisição e repeti-la.

Backend que não conhece o protocolo ignora o campo, o app não envia cabeçalho nenhum
fora do padrão e tudo funciona como antes.

### Armazenamento local

- **Segredos** (token de renovação): Keychain/Keystore no Android/iOS; cifrados com
  AES-256-GCM na web.
- **Dados de jogo** (time e lista de exploração): cifrados na web, selados com HMAC no
  celular — um save editado à mão para injetar Pokémon ou trocar de usuário é descartado.
- Saves da versão anterior, que ficavam em texto puro, são migrados automaticamente no
  primeiro login. Ninguém perde o time.
- Senha nunca é gravada, e o token de acesso nunca chega ao disco.

### Onde está cada coisa

| Arquivo | Responsabilidade |
|---|---|
| `src/config/env.ts` | URL da nuvem, rotas e validade dos tokens |
| `src/security/crypto.ts` | AES-GCM, HMAC-SHA256, base64 (WebCrypto na web, expo-crypto no celular) |
| `src/security/secureStore.ts` | chave do dispositivo, segredos e dados protegidos |
| `src/security/session.ts` | ciclo de vida da sessão e emissão dos tickets |
| `src/security/envelope.ts` | abrir envelopes e assinar requisições |
| `src/integration/cloudClient.ts` | portão único de HTTP: renovação, assinatura, 401 |
| `src/integration/authApi.ts` | login, cadastro, renovação, logout, perfil |
| `src/context/AuthContext.tsx` | estado de autenticação para as telas |

Nenhuma tela fala HTTP direto: tudo passa pelo `cloudClient`.

### Configuração

Copie `.env.example` para `.env` se precisar apontar para outro backend:

```bash
# backend Spring do projeto de login, rodando local
EXPO_PUBLIC_API_URL=http://localhost:8081/fatec/login
```

Sem `.env`, vale a URL de `app.json` → `expo.extra.apiUrl` (o API Gateway atual).

Dependências novas — já instaladas, mas para um ambiente limpo:

```bash
npx expo install expo-secure-store expo-crypto
```

### Até onde isso protege

Vale ser direto sobre o limite: o JavaScript roda na máquina do usuário, então essas
camadas encarecem muito bisbilhotar, adulterar e repetir tráfego, mas não tornam o
cliente confiável. Cifrar no cliente **soma** ao HTTPS, não substitui.

Quem decide de fato é o servidor. Para as garantias completas, o backend precisa
validar a assinatura do token, conferir `X-Poke-Signature` e recusar nonce repetido —
exatamente o que o projeto Spring de referência faz. O app já está pronto para esse
backend: é só apontar a URL.
