import { Platform } from "react-native";
import { AlertProps } from "./types";

import AlertAndroid from "./index.android";
import AlertWeb from "./index.web";

export {AlertImplementation as Alert};
export * from "./types";

const AlertImplementation = Platform.select({
  android: AlertAndroid,
  web: AlertWeb,
  default: AlertWeb
}) as React.FC<AlertProps>;