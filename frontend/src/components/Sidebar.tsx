'use client';

import Link from 'next/link';
import { FileText, Plus, Home } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#1a1a1a] border-r border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-full"></div>
          <div>
            <h1 className="text-xl font-bold text-white">VedaAI</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        <Link
          href="/assignments"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <Home size={20} />
          <span className="text-sm">Home</span>
        </Link>
        <Link
          href="/assignments/new"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <Plus size={20} />
          <span className="text-sm">Create</span>
        </Link>
        <Link
          href="/assignments"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors group"
        >
          <FileText size={20} />
          <span className="text-sm">Assignments</span>
          <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full group-hover:bg-orange-600">2</span>
        </Link>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            DS
          </div>
          <div className="text-xs">
            <p className="text-white font-medium">Delhi School</p>
            <p className="text-gray-500">Teacher</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
