import { getDefaultConfig } from "expo/metro-config";

const config = getDefaultConfig(process.cwd()); // Usar process.cwd() é mais seguro em ESM

const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...resolver.sourceExts, "svg", "mjs"],
};

export default config;
