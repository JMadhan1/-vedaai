'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssignmentStore } from '@/store/assignmentStore';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';

export default function NewAssignmentPage() {
  const router = useRouter();
  const { form, setFormField, submitAssignment } = useAssignmentStore();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.title || form.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    if (!form.subject) {
      newErrors.subject = 'Subject is required';
    }
    if (!form.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else if (new Date(form.dueDate) <= new Date()) {
      newErrors.dueDate = 'Due date must be in the future';
    }
    if (form.questionTypes.length === 0) {
      newErrors.questionTypes = 'At least one question type is required';
    }
    if (!form.totalQuestions || form.totalQuestions < 1 || form.totalQuestions > 50) {
      newErrors.totalQuestions = 'Total questions must be between 1 and 50';
    }
    if (!form.marksPerQuestion || form.marksPerQuestion < 1) {
      newErrors.marksPerQuestion = 'Marks per question must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const { assignmentId } = await submitAssignment();
      router.push(`/assignments/${assignmentId}`);
    } catch (error) {
      console.error('Failed to create assignment:', error);
      setErrors({
        submit: 'Failed to create assignment. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFormField('file', e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-8">
      <Link href="/assignments" className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 text-sm font-medium">
        <ArrowLeft size={18} />
        Assignments
      </Link>

      <div className="max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Create Assignment</h1>
          <p className="text-gray-400 text-sm">Upload material and organize your assignment</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg border border-gray-800 p-8">
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-800/50 rounded text-red-300 text-sm">
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-2 gap-12">
            {/* LEFT COLUMN - File Upload & Instructions */}
            <div>
              <div className="mb-8">
                <h2 className="text-base font-semibold text-white mb-2">Assignment Details</h2>
                <p className="text-gray-400 text-sm">Upload materials and provide context for question generation</p>
              </div>

              {/* File Upload */}
              <div className="mb-8">
                <label
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    dragActive ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <Upload className="mx-auto mb-3 text-gray-500" size={32} />
                  <p className="text-gray-300 text-sm font-medium mb-1">
                    {form.file ? form.file.name : 'Choose a file or drag it here'}
                  </p>
                  <p className="text-gray-500 text-xs">Upload images of your preferred document or things</p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFormField('file', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Title */}
              <div className="mb-6">
                <label className="block text-white text-sm font-medium mb-2">Assignment Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setFormField('title', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Biology Mid-Term"
                />
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setFormField('subject', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Biology"
                />
                {errors.subject && <p className="text-red-400 text-xs mt-1">{errors.subject}</p>}
              </div>
            </div>

            {/* RIGHT COLUMN - Form Fields */}
            <div>
              {/* Due Date */}
              <div className="mb-6">
                <label className="block text-white text-sm font-medium mb-2">Due Date</label>
                <input
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={(e) => setFormField('dueDate', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {errors.dueDate && <p className="text-red-400 text-xs mt-1">{errors.dueDate}</p>}
              </div>

              {/* Question Types Table */}
              <div className="mb-6">
                <label className="block text-white text-sm font-medium mb-3">Question Type</label>
                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                  <table className="w-full text-sm text-gray-300">
                    <thead className="bg-gray-900 border-b border-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-white">Type</th>
                        <th className="px-4 py-3 text-center w-16">+</th>
                        <th className="px-4 py-3 text-center w-16">Count</th>
                        <th className="px-4 py-3 text-center w-16">-</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.questionTypes.includes('mcq')}
                              onChange={(e) => {
                                const updated = e.target.checked
                                  ? [...form.questionTypes, 'mcq']
                                  : form.questionTypes.filter((t) => t !== 'mcq');
                                setFormField('questionTypes', updated);
                              }}
                              className="w-4 h-4 rounded border-gray-600 bg-gray-700"
                            />
                            <span>Multiple Choice Questions</span>
                          </label>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button type="button" className="text-gray-400 hover:text-white">
                            +
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center text-white font-medium">4</td>
                        <td className="px-4 py-3 text-center">
                          <button type="button" className="text-gray-400 hover:text-white">
                            -
                          </button>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.questionTypes.includes('short')}
                              onChange={(e) => {
                                const updated = e.target.checked
                                  ? [...form.questionTypes, 'short']
                                  : form.questionTypes.filter((t) => t !== 'short');
                                setFormField('questionTypes', updated);
                              }}
                              className="w-4 h-4 rounded border-gray-600 bg-gray-700"
                            />
                            <span>Short Questions</span>
                          </label>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button type="button" className="text-gray-400 hover:text-white">
                            +
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center text-white font-medium">3</td>
                        <td className="px-4 py-3 text-center">
                          <button type="button" className="text-gray-400 hover:text-white">
                            -
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.questionTypes.includes('long')}
                              onChange={(e) => {
                                const updated = e.target.checked
                                  ? [...form.questionTypes, 'long']
                                  : form.questionTypes.filter((t) => t !== 'long');
                                setFormField('questionTypes', updated);
                              }}
                              className="w-4 h-4 rounded border-gray-600 bg-gray-700"
                            />
                            <span>Long Answer</span>
                          </label>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button type="button" className="text-gray-400 hover:text-white">
                            +
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center text-white font-medium">5</td>
                        <td className="px-4 py-3 text-center">
                          <button type="button" className="text-gray-400 hover:text-white">
                            -
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {errors.questionTypes && <p className="text-red-400 text-xs mt-2">{errors.questionTypes}</p>}
              </div>

              {/* Total Questions & Marks */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">No. of Questions</label>
                  <input
                    type="number"
                    value={form.totalQuestions}
                    onChange={(e) => setFormField('totalQuestions', parseInt(e.target.value) || 0)}
                    min="1"
                    max="50"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="10"
                  />
                  {errors.totalQuestions && <p className="text-red-400 text-xs mt-1">{errors.totalQuestions}</p>}
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Marks</label>
                  <input
                    type="number"
                    value={form.marksPerQuestion}
                    onChange={(e) => setFormField('marksPerQuestion', parseInt(e.target.value) || 0)}
                    min="1"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="1"
                  />
                  {errors.marksPerQuestion && <p className="text-red-400 text-xs mt-1">{errors.marksPerQuestion}</p>}
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Additional Information (For better output)</label>
                <textarea
                  value={form.additionalInstructions}
                  onChange={(e) => setFormField('additionalInstructions', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Focus on chapters 1-5, Include questions about..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mt-12 pt-8 border-t border-gray-800">
            <Link
              href="/assignments"
              className="px-6 py-2 text-gray-300 bg-transparent border border-gray-700 rounded-lg hover:border-gray-600 text-sm font-medium transition-colors"
            >
              Previous
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="ml-auto px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-900 disabled:bg-gray-700 text-sm font-medium transition-colors border border-gray-700"
            >
              {submitting ? 'Creating...' : 'Next >'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
