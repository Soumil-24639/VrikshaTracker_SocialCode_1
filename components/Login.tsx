import React, { useState } from 'react';
import { Role, User } from '../types';
import { db, users } from '../services/db';
import { LeafIcon } from './icons';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('Alice'); // Default for demo
  const [error, setError] = useState('');

  const handleLogin = (role: Role) => {
    let user: User | undefined;
    if (role === Role.ADMIN) {
        user = db.getUser('user-admin');
    } else {
        // Find user by name, defaults to Alice if input is empty or not found
        user = users.find(u => u.name === username && u.role === Role.VOLUNTEER) || db.getUser('user-1');
    }

    if (user) {
      onLogin(user);
    } else {
      setError(`Could not find a user with the name: ${username}`);
    }
  };

  return (
    <div className="min-h-screen bg-main flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-glass rounded-2xl shadow-lg p-8 border border-gray-200/50 dark:border-gray-700/50">
        <div className="text-center mb-8">
          <LeafIcon className="w-16 h-16 mx-auto text-forest-green" />
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mt-4">Vriksha Tracker</h1>
          <p className="text-gray-500 dark:text-gray-300">The Sapling Guardian System</p>
        </div>
        <div className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <select
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-4 py-2.5 bg-white/50 dark:bg-gray-800/50 border border-gray-300/50 dark:border-gray-600/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent transition-all text-gray-900 dark:text-white"
            >
                {users.filter(u => u.role === Role.VOLUNTEER).map(u => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                ))}
            </select>
          </div>
          <div>
            <label htmlFor="password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
             <input type="password" id="password" value="password" readOnly className="mt-1 block w-full px-4 py-2.5 bg-gray-200/50 dark:bg-gray-900/50 border border-gray-300/50 dark:border-gray-700/50 rounded-lg shadow-sm sm:text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed" />
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Password is pre-filled for demo.</p>
          </div>
        </div>
        
        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

        <div className="mt-8 space-y-4">
          <button
            onClick={() => handleLogin(Role.VOLUNTEER)}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white btn-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#34495E] focus:ring-gradient-start"
          >
            Login as Volunteer
          </button>
          <button
            onClick={() => handleLogin(Role.ADMIN)}
            className="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-[#4A6572] rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100/50 dark:bg-[#4A6572]/50 hover:bg-gray-200/50 dark:hover:bg-[#5E7A8A]/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#34495E] focus:ring-gray-500 transition-all duration-300"
          >
            Login as Coordinator
          </button>
        </div>
      </div>
    </div>
  );
};