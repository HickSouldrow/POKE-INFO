import { View, ViewProps } from 'react-native';
import { Theme } from "../../styles/theme";

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...rest }: CardProps) {
  return (
    <View style={[Theme.styles.card, style]} {...rest}>
      {children}
    </View>
  );
}