'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAssignmentStore, Assignment } from '@/store/assignmentStore';
import { Plus, MoreVertical, Clock, AlertCircle } from 'lucide-react';

export default function AssignmentsPage() {
  const { assignments, fetchAssignments } = useAssignmentStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      await fetchAssignments();
      setLoading(false);
    }
    load();
  }, [fetchAssignments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'processing':
      case 'pending':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Done';
      case 'error':
        return 'Error';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading assignments...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#1a1a1a] min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Assignments</h1>
        </div>
        <Link
          href="/assignments/new"
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors border border-gray-700 text-sm font-medium"
        >
          <Plus size={18} />
          Create Assignment
        </Link>
      </div>

      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96">
          <div className="text-center">
            {/* Empty State Icon */}
            <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <div className="relative">
                <div className="w-20 h-24 border-2 border-gray-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">×</span>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">No assignments yet</h3>
            <p className="text-gray-400 mb-6 max-w-sm">
              Congratulations! You have completed all your assigned tasks. Create a new one to get started.
            </p>
            <Link
              href="/assignments/new"
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition-colors border border-gray-700 text-sm font-medium"
            >
              <Plus size={18} />
              Create Your First Assignment
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {assignments.map((assignment) => (
            <Link
              key={assignment._id}
              href={`/assignments/${assignment._id}`}
              className="bg-gray-900 rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-base font-semibold text-white flex-1 group-hover:text-orange-400 transition-colors">
                  {assignment.title}
                </h3>
                <button className="text-gray-500 hover:text-gray-300 transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <p className="text-sm text-gray-400">
                  Assigned on {new Date(assignment.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: '2-digit',
                  })}
                </p>
                <p className="text-sm text-gray-400">
                  Due: {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: '2-digit',
                  })}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                <span className={`text-xs font-medium ${getStatusColor(assignment.status)}`}>
                  {getStatusLabel(assignment.status)}
                </span>
                <span className="text-xs text-gray-500">{assignment.totalQuestions} Qs</span>
              </div>

              {assignment.errorMessage && (
                <div className="mt-3 p-2 bg-red-900/30 border border-red-800/50 rounded text-xs text-red-300">
                  {assignment.errorMessage}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
