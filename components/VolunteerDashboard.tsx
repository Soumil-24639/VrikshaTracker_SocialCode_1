import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { Sapling, User, HealthStatus, WeatherData } from '../types';
import { useGeolocation, useDbData } from '../hooks/useGeolocation';
import { MapPinIcon, PlusCircleIcon, SparklesIcon, TrashIcon, LeafIcon, TrophyIcon, SeedlingIcon, TreeIcon, AwardIcon, FilterXIcon } from './icons';
import { Modal } from './Modal';
import { analyzeSaplingUpdate, getHealthForecast, Forecast } from '../services/geminiService';
import { UserWithBadges } from '../services/db';

// --- Leaderboard Component ---
const LevelBadge: React.FC<{ level: string, className?: string }> = ({ level, className='' }) => {
    const levelInfo = {
        '🌿 Green Novice': { icon: SeedlingIcon, color: 'text-lime-500 dark:text-lime-400' },
        '🌲 Eco Guardian': { icon: TreeIcon, color: 'text-green-500 dark:text-green-400' },
        '🌳 Forest Hero': { icon: AwardIcon, color: 'text-emerald-500 dark:text-emerald-400' },
    };
    const { icon: Icon, color } = levelInfo[level as keyof typeof levelInfo] || { icon: SeedlingIcon, color: 'text-gray-500'};

    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            <Icon className={`w-5 h-5 ${color}`} />
            <span className={`font-semibold text-sm ${color}`}>{level}</span>
        </div>
    );
};

const UserBadges: React.FC<{ badges: string[], className?: string }> = ({ badges, className = '' }) => {
    const badgeInfo: Record<string, { icon: React.FC<any>, title: string, color: string }> = {
        'top_rank': { icon: TrophyIcon, title: 'Rank #1', color: 'text-yellow-500' },
        'high_scorer': { icon: SeedlingIcon, title: 'Growth Hero', color: 'text-green-500' },
    };

    return (
        <div className={`flex items-center space-x-1 ${className}`}>
            {badges.map(badgeKey => {
                const badge = badgeInfo[badgeKey];
                if (!badge) return null;
                const Icon = badge.icon;
                return (
                    <div key={badgeKey} className="group relative">
                        <Icon className={`w-5 h-5 ${badge.color}`} />
                        <span className="absolute bottom-full mb-2 hidden group-hover:block w-max bg-gray-800 text-white text-xs rounded py-1 px-2">
                            {badge.title}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};


export const Leaderboard: React.FC = () => {
    const leaderboardData = useDbData(db.getLeaderboard);
    
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="text-center mb-8">
                <TrophyIcon className="w-16 h-16 mx-auto text-yellow-500"/>
                <h2 className="text-4xl font-bold text-gray-800 dark:text-white mt-4">Leaderboard</h2>
                <p className="text-gray-500 dark:text-gray-400">Top Sapling Guardians</p>
            </div>
            <div className="max-w-3xl mx-auto space-y-4">
                {leaderboardData.map((user: UserWithBadges) => (
                    <div key={user.id} className="bg-glass rounded-xl shadow-md p-4 flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                        <div className="flex items-center space-x-4">
                            <div className="text-2xl font-bold w-10 text-center text-gray-700 dark:text-gray-300">{user.rank}</div>
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-mint-green to-forest-green flex items-center justify-center text-white text-xl font-bold">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <div className="flex items-center space-x-2">
                                    <p className="font-bold text-lg text-gray-800 dark:text-white">{user.name}</p>
                                    {user.badges && <UserBadges badges={user.badges} />}
                                </div>
                                {user.level && <LevelBadge level={user.level} />}
                            </div>
                        </div>
                        <div className="text-right font-bold text-xl text-forest-green dark:text-mint-green">
                           {user.points} pts
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


// --- My Saplings View Components ---

const HealthBadge: React.FC<{status: HealthStatus}> = ({ status }) => {
     const statusStyles: Record<HealthStatus, string> = {
        [HealthStatus.HEALTHY]: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 ring-green-500/30',
        [HealthStatus.NEEDS_WATER]: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 ring-yellow-500/30',
        [HealthStatus.DAMAGED]: 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 ring-orange-500/30',
        [HealthStatus.LOST]: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 ring-red-500/30',
    };
    return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ring-1 ring-inset ${statusStyles[status]}`}>
            {status}
        </span>
    )
}

interface SaplingCardProps {
    sapling: Sapling;
    onUpdateClick: (sapling: Sapling) => void;
    onDeleteClick: (sapling: Sapling) => void;
    onForecastClick: (sapling: Sapling) => void;
}

const SaplingCard: React.FC<SaplingCardProps> = ({ sapling, onUpdateClick, onDeleteClick, onForecastClick }) => {
    const latestUpdate = sapling.updates.length > 0 ? sapling.updates[sapling.updates.length - 1] : null;
    const statusColor = {
        [HealthStatus.HEALTHY]: 'border-green-500',
        [HealthStatus.NEEDS_WATER]: 'border-yellow-500',
        [HealthStatus.DAMAGED]: 'border-orange-500',
        [HealthStatus.LOST]: 'border-red-500',
    };

    return (
        <div className="bg-glass rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 border border-gray-200/50 dark:border-gray-700/50 relative group flex flex-col">
            <button
                onClick={() => onDeleteClick(sapling)}
                className="absolute top-3 right-3 p-1.5 text-gray-500 dark:text-gray-300 bg-white/60 dark:bg-black/40 rounded-full hover:bg-red-500 hover:text-white dark:hover:bg-red-500/60 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black/50 z-10 transition-all opacity-0 group-hover:opacity-100"
                aria-label={`Delete sapling ${sapling.id}`}
            >
                <TrashIcon className="w-5 h-5" />
            </button>
            {latestUpdate?.imageUrl ? (
                 <div
                    className="w-full h-48 bg-cover bg-center"
                    style={{ backgroundImage: `url(${latestUpdate.imageUrl})` }}
                    role="img"
                    aria-label={sapling.species}
                ></div>
            ) : (
                <div className="w-full h-48 bg-gray-200/50 dark:bg-[#2C3E50]/50 flex items-center justify-center">
                    <LeafIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                </div>
            )}
            <div className={`border-l-4 p-4 flex-grow flex flex-col justify-between ${latestUpdate ? statusColor[latestUpdate.status] : 'border-gray-300'}`}>
                <div>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{sapling.id}</p>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{sapling.species}</h3>
                        </div>
                        {latestUpdate && <HealthBadge status={latestUpdate.status}/>}
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-300 mt-2">
                        <MapPinIcon className="w-4 h-4 mr-2" />
                        <span className="text-sm">Lat: {sapling.location.lat.toFixed(4)}, Lng: {sapling.location.lng.toFixed(4)}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Planted on: {new Date(sapling.plantationDate).toLocaleDateString()}</p>
                    {latestUpdate?.recommendation && (
                        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/40 rounded-md border border-blue-200 dark:border-blue-700/50">
                            <div className="flex items-start text-blue-800 dark:text-blue-200">
                                <SparklesIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                <p className="text-xs font-semibold">AI Recommendation:</p>
                            </div>
                            <p className="text-xs text-blue-700 dark:text-blue-300 ml-6">{latestUpdate.recommendation}</p>
                        </div>
                    )}
                </div>
                 <div className="flex space-x-2 mt-4">
                    <button onClick={() => onUpdateClick(sapling)} className="flex-1 btn-gradient text-white font-bold py-2 px-4 rounded-lg">
                        Smart Update
                    </button>
                     <button onClick={() => onForecastClick(sapling)} className="px-4 py-2 bg-gray-200/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300/50 dark:hover:bg-gray-600/50">
                        Forecast
                    </button>
                </div>
            </div>
        </div>
    );
};

const RegisterSaplingForm: React.FC<{ user: User, onClose: () => void }> = ({ user, onClose }) => {
    const [species, setSpecies] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data: location, loading: locationLoading, error: locationError, getLocation } = useGeolocation();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && location) {
            const file = e.target.files[0];
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setAiRecommendation(null);
            
            setIsAnalyzing(true);
            const weather = db.getMockWeatherData(location.latitude, location.longitude);
            const soil = db.getSoilCondition(weather);
            const result = await analyzeSaplingUpdate(file, weather, soil);
            setAiRecommendation(result.recommendation);
            setIsAnalyzing(false);
        } else if (!location) {
            setError("Please capture location before selecting a photo for analysis.")
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!species.trim() || !image || !location) {
            setError('Please enter a species name, capture location, and upload a photo.');
            return;
        }
        setError('');
        setIsSubmitting(true);
        
        db.addSapling({ species, location: { lat: location.latitude, lng: location.longitude }, guardianId: user.id, image, recommendation: aiRecommendation || undefined });
        
        setTimeout(() => { 
            setIsSubmitting(false);
            onClose();
        }, 500);
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Species</label>
                <input
                    type="text"
                    value={species}
                    onChange={e => setSpecies(e.target.value)}
                    placeholder="e.g., Neem, Mango"
                    className="mt-1 block w-full px-4 py-2.5 bg-white/50 dark:bg-gray-800/50 border border-gray-300/50 dark:border-gray-600/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent transition-all"
                    required
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                <button type="button" onClick={getLocation} disabled={locationLoading} className="mt-1 w-full flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-600/50 disabled:opacity-50 transition-colors">
                    <MapPinIcon className="w-5 h-5 mr-2" />
                    {locationLoading ? 'Fetching...' : (location ? `Captured: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Capture GPS Location')}
                </button>
                {locationError && <p className="text-red-500 text-xs mt-1">{locationError.message}</p>}
            </div>
            <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Photo</label>
                 <input type="file" accept="image/*" onChange={handleImageChange} className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-mint-green/30 dark:file:bg-green-900/50 file:text-forest-green dark:file:text-green-300 hover:file:bg-mint-green/50 dark:hover:file:bg-green-800/50" required />
                 {previewUrl && <img src={previewUrl} alt="Sapling preview" className="mt-2 rounded-lg max-h-40 w-full object-contain" />}
            </div>

            {isAnalyzing && (
                <div className="mt-2 text-sm flex items-center text-indigo-600 dark:text-indigo-400">
                    <SparklesIcon className="w-4 h-4 mr-2 animate-pulse" />
                    AI is analyzing your photo...
                </div>
            )}
            {aiRecommendation && !isAnalyzing && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-md mt-2">
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">AI Recommendation:</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">{aiRecommendation}</p>
                </div>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={isSubmitting || locationLoading || isAnalyzing} className="w-full btn-gradient text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50">
                {isSubmitting ? 'Registering...' : 'Register Sapling'}
            </button>
        </form>
    );
};

const UpdateSaplingForm: React.FC<{ sapling: Sapling, user: User, onClose: () => void }> = ({ sapling, user, onClose }) => {
    const [status, setStatus] = useState<HealthStatus>(HealthStatus.HEALTHY);
    const [image, setImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState<{status: string, confidence: number, recommendation: string} | null>(null);
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [soilCondition, setSoilCondition] = useState<string | null>(null);

    const latestUpdate = sapling.updates.length > 0 ? sapling.updates[sapling.updates.length - 1] : null;

    useEffect(() => {
        // Pre-fill status from the latest update
        if (latestUpdate) {
            setStatus(latestUpdate.status);
        }
    }, [latestUpdate]);
    
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setAiResult(null);

            setIsAnalyzing(true);
            const weather = db.getMockWeatherData(sapling.location.lat, sapling.location.lng);
            const soil = db.getSoilCondition(weather);
            setWeatherData(weather);
            setSoilCondition(soil);

            const result = await analyzeSaplingUpdate(file, weather, soil, latestUpdate?.imageUrl);
            setAiResult(result);

            const validStatuses = Object.values(HealthStatus) as string[];
            if (validStatuses.includes(result.status)) {
                setStatus(result.status as HealthStatus);
            }

            setIsAnalyzing(false);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!image || !weatherData || !soilCondition) return;
        setIsSubmitting(true);

        db.addSaplingUpdate(sapling.id, { 
            status, 
            image, 
            userId: user.id, 
            recommendation: aiResult?.recommendation, 
            confidence: aiResult?.confidence,
            weather: weatherData,
            soil: soilCondition,
        });

        setTimeout(() => {
            setIsSubmitting(false);
            onClose();
        }, 500);
    };

    return (
         <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Photo</label>
                 <input type="file" accept="image/*" onChange={handleImageChange} className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-mint-green/30 dark:file:bg-green-900/50 file:text-forest-green dark:file:text-green-300 hover:file:bg-mint-green/50 dark:hover:file:bg-green-800/50" required />
                 <div className="mt-2 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-2 h-44 flex items-center justify-center">
                    {previewUrl ? (
                        <img src={previewUrl} alt="New sapling preview" className="rounded-md max-h-40 w-auto object-contain" />
                    ) : latestUpdate?.imageUrl ? (
                        <img src={latestUpdate.imageUrl} alt="Current sapling" className="rounded-md max-h-40 w-auto object-contain" />
                    ) : (
                        <span className="text-gray-500 text-sm">Image preview</span>
                    )}
                </div>
            </div>

            {isAnalyzing && (
                <div className="mt-2 text-sm flex items-center text-indigo-600 dark:text-indigo-400">
                    <SparklesIcon className="w-4 h-4 mr-2 animate-pulse" />
                    AI is analyzing environmental data...
                </div>
            )}

            {aiResult && weatherData && soilCondition && !isAnalyzing && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-md mt-2 space-y-2">
                    <div className="text-xs grid grid-cols-3 gap-2 text-center">
                        <div><span className="font-semibold">Weather</span><br/>{weatherData.temp}°C, {weatherData.humidity}% Hum</div>
                        <div><span className="font-semibold">Rainfall</span><br/>{weatherData.rainfall} mm</div>
                        <div><span className="font-semibold">Soil</span><br/>{soilCondition}</div>
                    </div>
                    <hr className="border-blue-200/50 dark:border-blue-700/50"/>
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">AI Recommendation:</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">{aiResult.recommendation} (Confidence: {(aiResult.confidence * 100).toFixed(0)}%)</p>
                </div>
            )}
            
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as HealthStatus)} className="mt-1 block w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-300/50 dark:border-gray-600/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent transition-all">
                    {Object.values(HealthStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {aiResult && !isAnalyzing && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 flex items-center">
                        <SparklesIcon className="w-3 h-3 mr-1" />
                        Status suggested by AI. You can change it if needed.
                    </p>
                )}
            </div>
            
            <button type="submit" disabled={isSubmitting || !image || isAnalyzing} className="w-full btn-gradient text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50">
                {isSubmitting ? 'Submitting...' : 'Submit Smart Update'}
            </button>
        </form>
    );
}

const QuickStats: React.FC<{user: User, saplings: Sapling[]}> = ({user, saplings}) => {
    const needsWaterCount = saplings.filter(s => s.updates[s.updates.length-1]?.status === HealthStatus.NEEDS_WATER).length;
    
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-glass p-4 rounded-xl shadow-sm text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">My Saplings</p>
                <p className="text-3xl font-bold text-forest-green dark:text-mint-green">{saplings.length}</p>
            </div>
            <div className="bg-glass p-4 rounded-xl shadow-sm text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">Needs Water</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{needsWaterCount}</p>
            </div>
            <div className="bg-glass p-4 rounded-xl shadow-sm text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">Guardian Points</p>
                <p className="text-3xl font-bold text-forest-green dark:text-mint-green">{user.points}</p>
            </div>
        </div>
    )
}

const ForecastModal: React.FC<{ sapling: Sapling, onClose: () => void }> = ({ sapling, onClose }) => {
    const [forecast, setForecast] = useState<Forecast | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchForecast = async () => {
            const latestUpdate = sapling.updates[sapling.updates.length - 1];
            if (latestUpdate && latestUpdate.weather) {
                setIsLoading(true);
                const result = await getHealthForecast(latestUpdate.status, latestUpdate.weather);
                setForecast(result);
                setIsLoading(false);
            } else {
                setForecast({ percentage: 0, direction: 'increase', explanation: "Not enough data for a forecast." });
                setIsLoading(false);
            }
        };
        fetchForecast();
    }, [sapling]);

    const isDecrease = forecast?.direction === 'decrease';

    return (
        <div className="text-gray-800 dark:text-gray-200">
            {isLoading ? (
                <div className="flex items-center justify-center p-4 min-h-[150px]">
                    <SparklesIcon className="w-6 h-6 mr-2 animate-pulse text-indigo-500" />
                    <p>Generating 7-day forecast...</p>
                </div>
            ) : forecast ? (
                <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Predicted Health Change</p>
                    <div className={`my-2 text-6xl font-bold flex items-center justify-center ${isDecrease ? 'text-red-500' : 'text-green-500'}`}>
                        {isDecrease ? '▼' : '▲'} {forecast.percentage}%
                    </div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/40 p-3 rounded-md text-sm">
                        <span className="font-semibold">AI Rationale:</span> {forecast.explanation}
                    </p>
                </div>
            ) : null}
             <div className="mt-6 flex justify-end">
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
};


export const VolunteerDashboard: React.FC<{ user: User, showLostOnly: boolean }> = ({ user, showLostOnly }) => {
  const getMySaplings = useCallback(() => db.getSaplingsByGuardian(user.id), [user.id]);
  const mySaplings = useDbData(getMySaplings);
  
  const [modal, setModal] = useState<{type: 'register' | 'update' | 'forecast'; sapling?: Sapling} | null>(null);
  const [saplingToDelete, setSaplingToDelete] = useState<Sapling | null>(null);

  const handleConfirmDelete = () => {
    if (saplingToDelete) {
      db.deleteSapling(saplingToDelete.id);
      setSaplingToDelete(null);
    }
  };

  const displayedSaplings = useMemo(() => {
    if (showLostOnly) {
        return mySaplings.filter(s => s.updates[s.updates.length - 1]?.status === HealthStatus.LOST);
    }
    return mySaplings;
  }, [mySaplings, showLostOnly]);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">My Saplings</h2>
                <p className="text-gray-600 dark:text-gray-300">Your personal grove of guarded saplings.</p>
            </div>
            <button onClick={() => setModal({ type: 'register' })} className="flex items-center btn-gradient text-white font-bold py-3 px-6 rounded-lg shadow-md">
                <PlusCircleIcon className="w-6 h-6 mr-2"/>
                Register New Sapling
            </button>
        </div>
        
        <QuickStats user={user} saplings={mySaplings}/>
        
        {showLostOnly && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 rounded-r-lg text-red-800 dark:text-red-200 flex items-center">
                <FilterXIcon className="w-5 h-5 mr-3" />
                <p className="text-sm font-medium">Showing only lost saplings. Clear the filter in settings to see all.</p>
            </div>
        )}

        <div>
            {displayedSaplings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedSaplings.map(sapling => (
                        <SaplingCard 
                            key={sapling.id} 
                            sapling={sapling} 
                            onUpdateClick={() => setModal({ type: 'update', sapling })}
                            onDeleteClick={setSaplingToDelete}
                            onForecastClick={() => setModal({ type: 'forecast', sapling })}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-glass rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                    <LeafIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500"/>
                    <p className="mt-4 text-gray-500 dark:text-gray-400">
                        {showLostOnly ? "You have no lost saplings." : "You haven't registered any saplings yet."}
                    </p>
                    {!showLostOnly && (
                         <button onClick={() => setModal({ type: 'register' })} className="mt-4 flex mx-auto items-center btn-gradient text-white font-bold py-2 px-4 rounded-lg shadow-md">
                            Register Your First Sapling
                        </button>
                    )}
                </div>
            )}
        </div>

        <Modal isOpen={modal?.type === 'register'} onClose={() => setModal(null)} title="Register a New Sapling">
           {modal?.type === 'register' && <RegisterSaplingForm user={user} onClose={() => setModal(null)} />}
        </Modal>
        <Modal isOpen={modal?.type === 'update'} onClose={() => setModal(null)} title={`Smart Update for ${modal?.sapling?.id}`}>
            {modal?.type === 'update' && modal.sapling && <UpdateSaplingForm sapling={modal.sapling} user={user} onClose={() => setModal(null)} />}
        </Modal>
        <Modal isOpen={modal?.type === 'forecast'} onClose={() => setModal(null)} title={`7-Day Forecast for ${modal?.sapling?.id}`}>
            {modal?.type === 'forecast' && modal.sapling && <ForecastModal sapling={modal.sapling} onClose={() => setModal(null)} />}
        </Modal>
        <Modal isOpen={!!saplingToDelete} onClose={() => setSaplingToDelete(null)} title="Confirm Deletion">
           {saplingToDelete && (
               <div className="text-gray-800 dark:text-gray-200">
                   <p>Are you sure you want to permanently delete the sapling <strong className="font-semibold">{saplingToDelete.species} ({saplingToDelete.id})</strong>?</p>
                   <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
                   <div className="mt-6 flex justify-end space-x-3">
                       <button
                           onClick={() => setSaplingToDelete(null)}
                           className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                       >
                           Cancel
                       </button>
                       <button
                           onClick={handleConfirmDelete}
                           className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                       >
                           Delete
                       </button>
                   </div>
               </div>
           )}
        </Modal>
    </div>
  );
};