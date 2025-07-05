import React, { createContext, useContext, useState } from 'react';
import AnimatedAlert from '../components/AnimatedAlert';

const AlertContext = createContext();

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

export const AlertProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);

    const showAlert = (message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random();
        const newAlert = { id, message, type, duration };
        setAlerts(prev => [...prev, newAlert]);
    };

    const removeAlert = (id) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    };

    const showSuccess = (message, duration) => showAlert(message, 'success', duration);
    const showError = (message, duration) => showAlert(message, 'error', duration);
    const showWarning = (message, duration) => showAlert(message, 'warning', duration);
    const showInfo = (message, duration) => showAlert(message, 'info', duration);

    return (
        <AlertContext.Provider value={{ showAlert, showSuccess, showError, showWarning, showInfo }}>
            {children}
            <div className="alert-container">
                {alerts.map(alert => (
                    <AnimatedAlert
                        key={alert.id}
                        message={alert.message}
                        type={alert.type}
                        duration={alert.duration}
                        onClose={() => removeAlert(alert.id)}
                    />
                ))}
            </div>
        </AlertContext.Provider>
    );
}; 