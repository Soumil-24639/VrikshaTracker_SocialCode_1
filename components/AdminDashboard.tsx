import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { db } from '../services/db';
import { HealthStatus, Sapling, SaplingUpdate, User } from '../types';
import { CsvIcon, PdfIcon } from './icons';
import { useDbData } from '../hooks/useGeolocation';

const COLORS = {
    [HealthStatus.HEALTHY]: '#2ECC71',
    [HealthStatus.NEEDS_WATER]: '#F1C40F',
    [HealthStatus.DAMAGED]: '#E67E22',
    [HealthStatus.LOST]: '#E74C3C',
};

const HealthStatusChart: React.FC<{ saplings: Sapling[] }> = ({ saplings }) => {
    const healthData = useMemo(() => {
        const counts = saplings.reduce((acc, s) => {
            const status = s.updates.length > 0 ? s.updates[s.updates.length - 1].status : HealthStatus.HEALTHY;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<HealthStatus, number>);
        
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [saplings]);

    return (
        <div className="bg-glass p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Overall Sapling Health</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={healthData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
                        {healthData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.name as HealthStatus]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{
                        backgroundColor: document.documentElement.classList.contains('dark') ? 'rgba(44, 62, 80, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
                    }} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

const HealthTrendChart: React.FC<{ saplings: Sapling[] }> = ({ saplings }) => {
    const trendData = useMemo(() => {
        const healthScores: Record<HealthStatus, number> = {
            [HealthStatus.HEALTHY]: 4,
            [HealthStatus.NEEDS_WATER]: 3,
            [HealthStatus.DAMAGED]: 2,
            [HealthStatus.LOST]: 1,
        };

        const updatesByDate: { [date: string]: { totalScore: number; count: number } } = {};

        saplings.forEach(sapling => {
            sapling.updates.forEach(update => {
                const date = new Date(update.date).toLocaleDateString();
                if (!updatesByDate[date]) {
                    updatesByDate[date] = { totalScore: 0, count: 0 };
                }
                updatesByDate[date].totalScore += healthScores[update.status];
                updatesByDate[date].count++;
            });
        });

        const data = Object.entries(updatesByDate)
            .map(([date, { totalScore, count }]) => ({
                date: new Date(date),
                'Avg Health Score': totalScore / count,
            }))
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(d => ({...d, date: d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}));

        return data.slice(-30); // Last 30 data points
    }, [saplings]);

    return (
        <div className="bg-glass p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Health Trend (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" className="dark:stroke-[#4A6572]" />
                    <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 12 }} className="[&_tspan]:dark:fill-[#BDC3C7]" />
                    <YAxis domain={[1, 4]} tickFormatter={(tick) => ['Lost', 'Damaged', 'Needs Water', 'Healthy'][tick-1]} tick={{ fill: '#6B7280', fontSize: 10 }} className="[&_tspan]:dark:fill-[#BDC3C7]" />
                    <Tooltip wrapperClassName="!bg-glass !border-none !shadow-lg"
                        contentStyle={{
                            backgroundColor: document.documentElement.classList.contains('dark') ? 'rgba(44, 62, 80, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                            color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
                        }}/>
                    <Line type="monotone" dataKey="Avg Health Score" stroke="#81C784" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }}/>
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};


const RainfallSurvivalChart: React.FC<{ saplings: Sapling[] }> = ({ saplings }) => {
    const rainfallData = useMemo(() => {
        const bins: { [key: string]: { total: number; survived: number } } = {
            'Dry (0mm)': { total: 0, survived: 0 },
            'Low (1-5mm)': { total: 0, survived: 0 },
            'Med (6-15mm)': { total: 0, survived: 0 },
            'High (>15mm)': { total: 0, survived: 0 },
        };

        saplings.forEach(s => {
            const avgRainfall = s.updates.reduce((sum, u) => sum + (u.weather?.rainfall || 0), 0) / s.updates.length;
            const isLost = s.updates[s.updates.length - 1]?.status === HealthStatus.LOST;

            let binKey: string;
            if (avgRainfall === 0) binKey = 'Dry (0mm)';
            else if (avgRainfall <= 5) binKey = 'Low (1-5mm)';
            else if (avgRainfall <= 15) binKey = 'Med (6-15mm)';
            else binKey = 'High (>15mm)';

            bins[binKey].total++;
            if (!isLost) {
                bins[binKey].survived++;
            }
        });

        return Object.entries(bins).map(([name, data]) => ({
            name,
            'Survival Rate': data.total > 0 ? (data.survived / data.total) * 100 : 0,
        }));
    }, [saplings]);

    return (
        <div className="bg-glass p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Survival vs. Avg. Rainfall</h3>
             <ResponsiveContainer width="100%" height={300}>
                 <BarChart data={rainfallData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" className="dark:stroke-[#4A6572]" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} className="[&_tspan]:dark:fill-[#BDC3C7]" />
                    <YAxis domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} tick={{ fill: '#6B7280', fontSize: 12 }} className="[&_tspan]:dark:fill-[#BDC3C7]" />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`}
                         wrapperClassName="!bg-glass !border-none !shadow-lg"
                         contentStyle={{
                            backgroundColor: document.documentElement.classList.contains('dark') ? 'rgba(44, 62, 80, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                            color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
                         }}
                    />
                    <Bar dataKey="Survival Rate" fill="#5DADE2" barSize={40} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};


const VolunteerPointsChart: React.FC<{ users: User[] }> = ({ users }) => {
     const volunteerData = useMemo(() => {
        return users
            .filter(u => u.role === 'VOLUNTEER')
            .sort((a, b) => b.points - a.points)
            .slice(0, 10) // Top 10 volunteers
            .map(u => ({ name: u.name, points: u.points }));
    }, [users]);
    
    return (
         <div className="bg-glass p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Top Volunteer Eco-Points</h3>
            <ResponsiveContainer width="100%" height={300}>
                 <BarChart data={volunteerData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" className="dark:stroke-[#4A6572]" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} className="[&_tspan]:dark:fill-[#BDC3C7]" />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} className="[&_tspan]:dark:fill-[#BDC3C7]" />
                    <Tooltip wrapperClassName="!bg-glass !border-none !shadow-lg"
                         contentStyle={{
                            backgroundColor: document.documentElement.classList.contains('dark') ? 'rgba(44, 62, 80, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                            color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
                         }}
                    />
                    <Bar dataKey="points" fill="#388E3C" name="Eco Points" barSize={40} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

const StatCard: React.FC<{ title: string, value: string | number, subtext?: string}> = ({ title, value, subtext }) => (
    <div className="bg-glass p-6 rounded-xl shadow-lg">
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
        <p className="text-4xl font-bold text-gray-800 dark:text-white mt-2">{value}</p>
        {subtext && <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{subtext}</p>}
    </div>
)

export const AdminDashboard: React.FC = () => {
    const allSaplings = useDbData(db.getAllSaplings);
    const allUsers = useDbData(db.getAllUsers);

    const totalSaplings = allSaplings.length;
    
    const lostSaplings = allSaplings.filter(s =>
        s.updates.length > 0 && s.updates[s.updates.length - 1].status === HealthStatus.LOST
    ).length;

    const survivalRate = totalSaplings > 0
        ? `${(((totalSaplings - lostSaplings) / totalSaplings) * 100).toFixed(0)}%`
        : '0%';

    const followUpCount = allSaplings.reduce((acc, s) => acc + (s.updates.length > 1 ? 1 : 0), 0);
    
    const followUpRate = totalSaplings > 0
        ? `${((followUpCount / totalSaplings) * 100).toFixed(0)}%`
        : '0%';
        
    const activeVolunteers = allUsers.filter(u => u.role === 'VOLUNTEER').length;

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-4xl font-bold text-gray-800 dark:text-white">Smart Insights</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">AI-driven analytics of the Vriksha Tracker project.</p>
                </div>
                <div className="flex space-x-3">
                    <button className="flex items-center bg-white/80 dark:bg-[#4A6572]/80 hover:bg-white dark:hover:bg-[#5E7A8A] text-gray-700 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md border border-gray-200 dark:border-transparent">
                        <CsvIcon className="w-5 h-5 mr-2" />
                        Export CSV
                    </button>
                    <button className="flex items-center bg-white/80 dark:bg-[#4A6572]/80 hover:bg-white dark:hover:bg-[#5E7A8A] text-gray-700 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md border border-gray-200 dark:border-transparent">
                        <PdfIcon className="w-5 h-5 mr-2" />
                        Download PDF
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Saplings" value={totalSaplings} />
                <StatCard title="Survival Rate" value={survivalRate} subtext={`${totalSaplings - lostSaplings} of ${totalSaplings} survived`} />
                <StatCard title="Follow-up Rate" value={followUpRate} subtext={`${followUpCount} saplings updated`} />
                <StatCard title="Active Volunteers" value={activeVolunteers} />
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <HealthStatusChart saplings={allSaplings} />
                <HealthTrendChart saplings={allSaplings} />
                <RainfallSurvivalChart saplings={allSaplings} />
                <VolunteerPointsChart users={allUsers}/>
            </div>

        </div>
    );
};