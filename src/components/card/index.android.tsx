import React from "react";
import { View, ViewProps } from 'react-native';
import { Theme } from "../../styles/theme";

export const Card: React.FC<ViewProps> = ({ children, style, ...rest }) => {
    return (
        <View style={[Theme.styles.card, style]} {...rest}>
            {children}
        </View>
    );
};
export default Card;