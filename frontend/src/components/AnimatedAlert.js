import React, { useState, useEffect } from 'react';
import './AnimatedAlert.css';

const AnimatedAlert = ({ message, type = 'info', duration = 3000, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setIsAnimating(true);
        setTimeout(() => {
            setIsVisible(false);
            if (onClose) onClose();
        }, 300);
    };

    if (!isVisible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            case 'warning':
                return '⚠️';
            case 'info':
                return 'ℹ️';
            default:
                return '💬';
        }
    };

    const getTypeClass = () => {
        switch (type) {
            case 'success':
                return 'alert-success';
            case 'error':
                return 'alert-error';
            case 'warning':
                return 'alert-warning';
            case 'info':
                return 'alert-info';
            default:
                return 'alert-info';
        }
    };

    return (
        <div className={`animated-alert ${getTypeClass()} ${isAnimating ? 'alert-exit' : 'alert-enter'}`}>
            <div className="alert-content">
                <span className="alert-icon">{getIcon()}</span>
                <span className="alert-message">{message}</span>
                <button className="alert-close" onClick={handleClose}>
                    ✕
                </button>
            </div>
        </div>
    );
};

export default AnimatedAlert; 