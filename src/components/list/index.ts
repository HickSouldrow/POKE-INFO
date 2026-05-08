import { Platform } from "react-native";
import { List as ListAndroid } from "./index.android";
import { List as ListWeb } from "./index.web";

const ListImplementation = Platform.select({
    android: ListAndroid,
    ios: ListAndroid,
    web: ListWeb,
    default: ListWeb,
});

export { ListImplementation as List };
