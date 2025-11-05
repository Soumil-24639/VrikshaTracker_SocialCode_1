import React from 'react';
import { BellIcon, SparklesIcon, XIcon } from './icons'; // Assuming you have these icons

export interface AppNotification {
    id: string;
    message: string;
    type: 'info' | 'warning' | 'success';
}

interface NotificationsProps {
    notifications: AppNotification[];
    onDismiss: (id: string) => void;
}

const notificationStyles = {
    info: {
        bg: 'bg-blue-100 dark:bg-blue-900/50',
        border: 'border-blue-500',
        text: 'text-blue-800 dark:text-blue-200',
        icon: <BellIcon className="w-5 h-5 text-blue-500" />,
    },
    warning: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/50',
        border: 'border-yellow-500',
        text: 'text-yellow-800 dark:text-yellow-200',
        icon: <BellIcon className="w-5 h-5 text-yellow-500" />,
    },
    success: {
        bg: 'bg-green-100 dark:bg-green-900/50',
        border: 'border-green-500',
        text: 'text-green-800 dark:text-green-200',
        icon: <SparklesIcon className="w-5 h-5 text-green-500" />,
    },
};

export const Notifications: React.FC<NotificationsProps> = ({ notifications, onDismiss }) => {
    if (notifications.length === 0) {
        return null;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-3">
            {notifications.map(notification => {
                const styles = notificationStyles[notification.type];
                return (
                    <div
                        key={notification.id}
                        className={`relative flex items-start p-4 border-l-4 rounded-r-lg shadow-md ${styles.bg} ${styles.border}`}
                        role="alert"
                    >
                        <div className="flex-shrink-0">{styles.icon}</div>
                        <div className={`ml-3 flex-1 ${styles.text}`}>
                            <p className="text-sm font-medium">{notification.message}</p>
                        </div>
                        <button
                            onClick={() => onDismiss(notification.id)}
                            className={`ml-3 p-1 rounded-full ${styles.text} opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10`}
                            aria-label="Dismiss"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};