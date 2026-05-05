import React, { useEffect } from "react";
import { Alert as RNAlert } from "react-native";
import { AlertProps } from "./types";

const AlertAndroid: React.FC<AlertProps> = ({ title, message, visible, onClose, type = 'info' }) => {
    
    useEffect(() => {
        if (visible) {

            const icons = {
                error: '🚫',
                success: '✅',
                warning: '⚠️',
                info: 'ℹ️'
            };

            const alertTitle = `${icons[type] || icons.info} ${title}`;

            RNAlert.alert(
                alertTitle, 
                message, 
                [
                    { 
                        text: 'ENTENDIDO', 
                        onPress: onClose 
                    }
                ],
                { 
                    cancelable: true, 
                    onDismiss: onClose 
                }
            );
        }
    }, [visible, title, message, onClose, type]);

    return null;
};

export default AlertAndroid;