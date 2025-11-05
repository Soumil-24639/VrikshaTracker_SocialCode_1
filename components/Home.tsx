import React, { useState, useEffect } from 'react';
import { SparklesIcon, ChartBarIcon, TrophyIcon, BotMessageSquareIcon, LeafIcon, CloudRainIcon } from './icons';
import { motion } from 'framer-motion';

// Count-up animation hook
const useCountUp = (end: number, duration = 2000) => {
    const [count, setCount] = useState(0);
    const frameRate = 1000 / 60;
    const totalFrames = Math.round(duration / frameRate);

    useEffect(() => {
        let frame = 0;
        const counter = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            setCount(Math.round(end * progress));

            if (frame === totalFrames) {
                clearInterval(counter);
                setCount(end); // Ensure it ends on the exact number
            }
        }, frameRate);

        return () => clearInterval(counter);
    }, [end, duration, totalFrames]);

    return count;
};

// Sub-components for Home page
const HeroSection = () => (
    <div className="relative text-center py-20 sm:py-32 z-10">
        <h1 className="text-5xl md:text-7xl font-bold text-gray-800 dark:text-white tracking-tighter">
            Vriksha Tracker 🌿
        </h1>
        <p className="mt-4 text-2xl md:text-3xl font-serif text-gray-700 dark:text-gray-200" style={{ fontFamily: "'Lora', 'Cormorant Garamond', serif" }}>
            Your Planet’s Digital Guardian.
        </p>
        <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
            Because every leaf deserves to live.
        </p>
    </div>
);

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateXValue = ((y - centerY) / centerY) * -8; // tilt intensity
        const rotateYValue = ((x - centerX) / centerX) * 8;
        setRotateX(rotateXValue);
        setRotateY(rotateYValue);
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
    };

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transformStyle: 'preserve-3d',
                rotateX,
                rotateY,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            whileHover={{ y: -8 }}
            className="bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-3xl p-6 text-center shadow-md hover:shadow-2xl shadow-emerald-200/40 dark:shadow-emerald-900/40 border border-emerald-200/40 transition-shadow duration-300 ease-out"
        >
            <div 
                style={{ transform: 'translateZ(50px)' }}
                className="mx-auto w-16 h-16 mb-4 rounded-full flex items-center justify-center bg-gradient-to-br from-mint-green/50 to-forest-green/50 text-white"
            >
                {icon}
            </div>
            <h3 
                style={{ transform: 'translateZ(30px)' }}
                className="text-xl font-bold text-gray-800 dark:text-white">{title}
            </h3>
            <p 
                style={{ transform: 'translateZ(20px)' }}
                className="mt-2 text-gray-600 dark:text-gray-300 text-sm">{description}
            </p>
        </motion.div>
    );
};

const featureList = [
    { icon: <SparklesIcon className="w-8 h-8" />, title: 'AI Health Detection', description: 'Detects plant condition from images (Healthy, Needs Water, etc.).' },
    { icon: <CloudRainIcon className="w-8 h-8" />, title: 'Weather Intelligence', description: 'Fuses real-time weather with AI predictions for smarter care.' },
    { icon: <ChartBarIcon className="w-8 h-8" />, title: 'Eco Analytics', description: 'AI-powered charts for sapling growth and environmental trends.' },
    { icon: <TrophyIcon className="w-8 h-8" />, title: 'Gamified Leaderboard', description: 'Earn points and climb eco ranks from Green Novice to Forest Hero.' },
    { icon: <BotMessageSquareIcon className="w-8 h-8" />, title: 'AI Chatbot Assistant', description: 'Instant guidance and environmental insights through conversation.' },
];

const ImpactStat = ({ value, label }: { value: number, label: string }) => {
    const count = useCountUp(value);
    return (
        <div className="bg-white/30 dark:bg-black/20 backdrop-blur-sm shadow-md rounded-xl p-6 text-center border border-white/20 dark:border-black/20">
            <p className="text-4xl font-bold text-forest-green dark:text-mint-green">{count.toLocaleString()}</p>
            <p className="mt-1 text-gray-600 dark:text-gray-300">{label}</p>
        </div>
    );
};

export const Home: React.FC<{ setView: (view: any) => void }> = ({ setView }) => {
    return (
        <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-[#213444] dark:to-[#2E7D32]/20 z-0">
                <div className="leaves">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="leaf-container">
                            <div className="leaf">🌿</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
                <HeroSection />

                <div className="my-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6" style={{ perspective: '1000px' }}>
                    {featureList.map(feature => (
                        <FeatureCard key={feature.title} {...feature} />
                    ))}
                </div>

                <div className="my-24 text-center">
                     <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Our Global Impact</h2>
                     <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                        <ImpactStat value={350} label="Saplings Tracked" />
                        <ImpactStat value={95} label="Survival Rate (%)" />
                        <ImpactStat value={120} label="Eco Volunteers" />
                        <ImpactStat value={18} label="Cities Connected" />
                    </div>
                </div>

                <div className="my-20 text-center">
                    <p className="text-xl italic text-gray-600 dark:text-gray-300 font-serif" style={{ fontFamily: "'Lora', 'Cormorant Garamond', serif" }}>
                        “Each leaf you nurture brings the planet closer to balance.”
                    </p>
                    <button 
                        onClick={() => setView('my_saplings')}
                        className="mt-8 inline-flex items-center btn-gradient text-white font-bold py-3 px-8 rounded-lg shadow-lg text-lg transform hover:scale-105 transition-transform duration-300">
                        Start Protecting <LeafIcon className="w-6 h-6 ml-2"/>
                    </button>
                </div>
            </div>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Lora:ital@0;1&family=Cormorant+Garamond:wght@400;700&display=swap');
                .leaves {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    z-index: 0;
                }
                .leaf-container {
                    position: absolute;
                    top: -10%;
                    animation: fall linear infinite;
                }
                .leaf {
                    font-size: 2rem;
                    opacity: 0.3;
                    transform: rotate(0deg);
                    animation: spin 8s linear infinite;
                }
                @keyframes fall {
                    0% { top: -10%; }
                    100% { top: 110%; }
                }
                @keyframes spin {
                    0% { transform: rotate(0deg) translateX(5px); }
                    100% { transform: rotate(360deg) translateX(10px); }
                }
                ${[...Array(10)].map((_, i) => `
                    .leaves .leaf-container:nth-child(${i + 1}) {
                        left: ${Math.random() * 100}%;
                        animation-duration: ${10 + Math.random() * 10}s;
                        animation-delay: ${Math.random() * 5}s;
                    }
                     .leaves .leaf-container:nth-child(${i + 1}) .leaf {
                        font-size: ${1 + Math.random() * 1.5}rem;
                        animation-duration: ${5 + Math.random() * 5}s;
                    }
                `).join('')}
            `}</style>
        </div>
    );
};