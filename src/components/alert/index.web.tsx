import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, Animated, Platform, StyleSheet } from 'react-native';
import { AlertProps } from "./types";

import { Theme } from '../../constants/theme';

const AlertWeb: React.FC<AlertProps> = ({ 
  title, 
  message, 
  visible, 
  onClose, 
  type = 'info',
  autoCloseDuration // Agora usando a nova prop do seu types.ts
}) => {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
        if(visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300, 
                useNativeDriver: true, 
            }).start();
            
            // Usando a duração dinâmica que definimos no types.ts
            const timer = setTimeout(onClose, autoCloseDuration || 6000);
            return () => clearTimeout(timer);
        } else {
            fadeAnim.setValue(0);
        }
    }, [visible, fadeAnim, onClose, autoCloseDuration]);


    const alertColors = {
      info: { border: '#007bff', text: '#007bff' },
      success: { border: '#28a745', text: '#28a745' },
      error: { border: '#dc3545', text: '#dc3545' },
      warning: { border: '#ffc107', text: '#ffc107' }
    };
    const currentColors = alertColors[type as keyof typeof alertColors];

    return (
        <Modal
            transparent={true}
            visible={visible}
            onRequestClose={onClose} 
            animationType="none" >
            <View style={styles.overlay}>
                <Animated.View 
                    style={[
                        Theme.styles.card,
                        styles.alertAdjustments, 
                        { 
                            opacity: fadeAnim, 
                            borderColor: currentColors.border,
                            shadowColor: currentColors.border 
                        }
                    ]}>
                    
                    <View style={styles.content}>
                        <Text style={[
                            Theme.styles.pokemonName, 
                            { color: currentColors.text, fontSize: 18, marginBottom: 4 }
                        ]}>
                            {title}
                        </Text>
                        <Text style={[styles.message, { color: Theme.colors.textSecondary }]}>
                            {message}
                        </Text>
                    </View>

                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={{ color: currentColors.text, fontSize: 20, fontWeight: 'bold' }}>
                            ✕
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertAdjustments: {
    width: '100%',
    maxWidth: 450,
    flexDirection: 'row',
    alignItems: 'flex-start',
    // Sobrescrevendo o gap se necessário para o layout do alerta
    gap: 0, 
  },
  content: {
    flex: 1,
    paddingRight: 10,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
    marginTop: -4, 
  }
});

export default AlertWeb;