import React, { useState, useEffect, useCallback } from 'react';
import { Login } from './components/Login';
import { VolunteerDashboard, Leaderboard } from './components/VolunteerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Header } from './components/Header';
import { User, Role } from './types';
import MapView from './components/MapView';
import SaplingList from './components/SaplingList';
import { AIChatBot } from './components/AIChatBot';
import { SocialFeed } from './components/SocialFeed';
import { Home } from './components/Home';
import { HomeIcon, DashboardIcon, LeafIcon, MapViewIcon, SaplingListIcon, TrophyIcon, BotMessageSquareIcon, UsersRoundIcon } from './components/icons';
import { Notifications, AppNotification } from './components/Notifications';
import { useDbData } from './hooks/useGeolocation';
import { db } from './services/db';

type View = 'home' | 'my_saplings' | 'leaderboard' | 'social_feed' | 'ai_chat' | 'dashboard' | 'map' | 'list';
type Theme = 'light' | 'dark';

const volunteerNavItems = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'my_saplings', label: 'My Saplings', icon: LeafIcon },
    { id: 'leaderboard', label: 'Leaderboard', icon: TrophyIcon },
    { id: 'social_feed', label: 'Social', icon: UsersRoundIcon },
    { id: 'ai_chat', label: 'AI Chatbot', icon: BotMessageSquareIcon },
];

const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'map', label: 'Map View', icon: MapViewIcon },
    { id: 'list', label: 'Sapling List', icon: SaplingListIcon },
];

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [view, setView] = useState<View>('my_saplings');
    const [theme, setTheme] = useState<Theme>('light');
    const [activeNotifications, setActiveNotifications] = useState<AppNotification[]>([]);
    const [showLostOnly, setShowLostOnly] = useState(false);

    const getNotifications = useCallback(() => {
        return currentUser ? db.getNotificationsForUser(currentUser.id) : [];
    }, [currentUser]);

    const notifications = useDbData(getNotifications);
    
    useEffect(() => {
        setActiveNotifications(notifications);
    }, [notifications]);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
         // Force recharts Tooltip to re-render with new theme styles
        window.dispatchEvent(new Event('resize'));
    }, [theme]);

    const handleLogin = (user: User) => {
        setCurrentUser(user);
        setShowLostOnly(false);
        if (user.role === Role.ADMIN) {
            setView('dashboard');
        } else {
            setView('home');
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };

    const handleDismissNotification = (id: string) => {
        setActiveNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleToggleLostFilter = () => {
        setShowLostOnly(prev => !prev);
        // Switch to a relevant view if not already on one
        if (currentUser?.role === Role.ADMIN && !['list', 'map'].includes(view)) {
            setView('list');
        } else if (currentUser?.role === Role.VOLUNTEER && view !== 'my_saplings') {
            setView('my_saplings');
        }
    }
    
    if (!currentUser) {
        return <Login onLogin={handleLogin} />;
    }

    const navItems = currentUser.role === Role.ADMIN ? adminNavItems : volunteerNavItems;

    const renderView = () => {
        switch (view) {
            case 'home': return <Home setView={setView} />;
            case 'my_saplings': return <VolunteerDashboard user={currentUser} showLostOnly={showLostOnly} />;
            case 'leaderboard': return <Leaderboard />;
            case 'social_feed': return <SocialFeed currentUser={currentUser} />;
            case 'ai_chat': return <div className="h-full"><AIChatBot /></div>;
            case 'dashboard': return <AdminDashboard />;
            case 'map': return <MapView />;
            case 'list': return <SaplingList showLostOnly={showLostOnly}/>;
            default: return <Home setView={setView} />;
        }
    };

    return (
        <div className="min-h-screen bg-main text-gray-800 dark:text-gray-200 flex flex-col">
            <Header 
              user={currentUser} 
              onLogout={handleLogout} 
              theme={theme} 
              setTheme={setTheme}
              showLostOnly={showLostOnly}
              onToggleLostFilter={handleToggleLostFilter}
            />
            <div className="flex flex-1 overflow-hidden">
                <nav className="w-20 lg:w-64 bg-white/50 dark:bg-[#34495E]/50 p-2 lg:p-4 transition-all duration-300 flex-shrink-0">
                    <ul className="space-y-2">
                        {navItems.map(item => {
                            const Icon = item.icon;
                            const isActive = view === item.id;
                            return (
                                <li key={item.id}>
                                    <button
                                        onClick={() => setView(item.id as View)}
                                        className={`w-full flex items-center p-3 lg:p-4 rounded-lg text-left transition-colors duration-200 ${
                                            isActive
                                                ? 'bg-gradient-to-r from-mint-green to-forest-green text-white shadow-lg'
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-[#4A6572]/50'
                                        }`}
                                    >
                                        <Icon className="w-6 h-6 flex-shrink-0" />
                                        <span className="ml-4 font-semibold hidden lg:inline">{item.label}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
                <main className="flex-1 overflow-y-auto">
                    {currentUser.role === Role.VOLUNTEER && (
                      <Notifications notifications={activeNotifications} onDismiss={handleDismissNotification} />
                    )}
                   {renderView()}
                </main>
            </div>
        </div>
    );
};

export default App;
