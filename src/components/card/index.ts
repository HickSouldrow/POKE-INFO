import { Platform } from "react-native";
import CardAndroid from "./index.android";
import CardWeb from "./index.web";

const CardImplementation = Platform.select({
  android: CardAndroid,
  ios: CardAndroid, 
  web: CardWeb,
  default: CardWeb
});

export { CardImplementation as Card };