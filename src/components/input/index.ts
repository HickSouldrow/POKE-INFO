import { Platform } from "react-native";
import { Input as InputAndroid } from "./index.android";
import { Input as InputWeb } from "./index.web";

const InputImplementation = Platform.select({
    android: InputAndroid,
    ios: InputAndroid,
    web: InputWeb,
    default: InputWeb,
});

export { InputImplementation as Input };
