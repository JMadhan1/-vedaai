'use client';

import { Bell, Settings } from 'lucide-react';

export default function TopBar() {
  return (
    <header className="bg-[#1a1a1a] border-b border-gray-700 h-16 flex items-center justify-between px-8">
      <h2 className="text-lg font-semibold text-white">Assignments</h2>
      <div className="flex items-center gap-4">
        <button className="text-gray-400 hover:text-white transition-colors">
          <Bell size={20} />
        </button>
        <button className="text-gray-400 hover:text-white transition-colors">
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
}
