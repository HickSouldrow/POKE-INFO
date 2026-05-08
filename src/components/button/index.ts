import { Platform } from "react-native";
import { Button as ButtonAndroid } from "./index.android";
import { Button as ButtonWeb } from "./index.web";

const ButtonImplementation = Platform.select({
    android: ButtonAndroid,
    ios: ButtonAndroid,
    web: ButtonWeb,
    default: ButtonWeb,
});

export { ButtonImplementation as Button };
