import React from "react";
import { View, ViewProps, StyleSheet } from 'react-native';
import { Theme } from "../../styles/theme";

export const Card: React.FC<ViewProps> = ({ children, style, ...rest }) => {
    return (
        <View 
            style={[
                Theme.styles.card, 
                { cursor: 'pointer', width: '100%' }, 
                style
            ]} 
            {...rest}
        >
            {children}
        </View>
    );
};
export default Card;