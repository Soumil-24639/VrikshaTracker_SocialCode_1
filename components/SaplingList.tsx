import React, { useState, useMemo } from 'react';
import { db, users as allUsersList } from '../services/db';
import { Sapling, HealthStatus, User } from '../types';
import { useDbData } from '../hooks/useGeolocation';
import { FilterXIcon } from './icons';

const statusColors: { [key in HealthStatus]: string } = {
  [HealthStatus.HEALTHY]: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
  [HealthStatus.NEEDS_WATER]: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300',
  [HealthStatus.DAMAGED]: 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300',
  [HealthStatus.LOST]: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300',
};


const SaplingList: React.FC<{ showLostOnly: boolean }> = ({ showLostOnly }) => {
    const allSaplings = useDbData(db.getAllSaplings);
    const allUsers = useMemo(() => {
        return new Map<string, User>(allUsersList.map(user => [user.id, user]));
    }, []);

    const [searchTerm, setSearchTerm] = useState('');

    const filteredSaplings = useMemo(() => {
        let saplings = allSaplings;

        if (showLostOnly) {
            saplings = saplings.filter(s => s.updates[s.updates.length - 1]?.status === HealthStatus.LOST);
        }

        if (!searchTerm) return saplings;
        const lowercasedFilter = searchTerm.toLowerCase();
        return saplings.filter(sapling => 
            sapling.id.toLowerCase().includes(lowercasedFilter) ||
            sapling.species.toLowerCase().includes(lowercasedFilter) ||
            (allUsers.get(sapling.guardianId)?.name.toLowerCase().includes(lowercasedFilter))
        );
    }, [allSaplings, searchTerm, allUsers, showLostOnly]);

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">All Saplings</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">A complete list of every sapling in the system.</p>
            
            {showLostOnly && (
                <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 rounded-r-lg text-red-800 dark:text-red-200 flex items-center">
                    <FilterXIcon className="w-5 h-5 mr-3" />
                    <p className="text-sm font-medium">Showing only lost saplings. Clear the filter in settings to see all.</p>
                </div>
            )}
            
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search by ID, Species, or Guardian..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-lg p-3 bg-white/50 dark:bg-[#34495E]/50 border border-gray-300/50 dark:border-[#4A6572]/50 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-forest-green transition-all"
                />
            </div>

            <div className="bg-glass rounded-xl shadow-lg overflow-x-auto">
                <table className="min-w-full text-left text-sm font-light text-gray-900 dark:text-white">
                    <thead className="border-b border-gray-200/50 dark:border-[#4A6572]/50 font-medium text-gray-600 dark:text-gray-300 uppercase">
                        <tr>
                            <th scope="col" className="px-6 py-4">Sapling ID</th>
                            <th scope="col" className="px-6 py-4">Species</th>
                            <th scope="col" className="px-6 py-4">Guardian</th>
                            <th scope="col" className="px-6 py-4">Location (Lat, Lng)</th>
                            <th scope="col" className="px-6 py-4">Latest Status</th>
                            <th scope="col" className="px-6 py-4">Last Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSaplings.map(sapling => {
                            const latestUpdate = sapling.updates.length > 0 ? sapling.updates[sapling.updates.length - 1] : null;
                            const guardian = allUsers.get(sapling.guardianId);

                            return (
                                <tr key={sapling.id} className="border-b border-gray-200/50 dark:border-[#4A6572]/50 hover:bg-gray-50/30 dark:hover:bg-[#4A6572]/40 transition-colors">
                                    <td className="whitespace-nowrap px-6 py-4 font-medium">{sapling.id}</td>
                                    <td className="whitespace-nowrap px-6 py-4">{sapling.species}</td>
                                    <td className="whitespace-nowrap px-6 py-4">{guardian?.name || 'N/A'}</td>
                                    <td className="whitespace-nowrap px-6 py-4">{`${sapling.location.lat.toFixed(4)}, ${sapling.location.lng.toFixed(4)}`}</td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        {latestUpdate ? (
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[latestUpdate.status]}`}>
                                                {latestUpdate.status}
                                            </span>
                                        ) : <span className="text-gray-500 dark:text-gray-400">Not updated</span>}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">{latestUpdate ? new Date(latestUpdate.date).toLocaleDateString() : 'N/A'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {filteredSaplings.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 p-8">No saplings found.</p>}
            </div>
        </div>
    );
};

export default SaplingList;