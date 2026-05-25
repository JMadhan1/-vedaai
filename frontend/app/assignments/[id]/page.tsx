'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAssignmentStore, GeneratedPaper } from '@/store/assignmentStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ArrowLeft, Download, RefreshCw, Loader } from 'lucide-react';
import Link from 'next/link';

export default function AssignmentDetailPage() {
  const params = useParams();
  const assignmentId = params.id as string;

  const { generationStatus, currentPaper, fetchPaper, setGenerationStatus, setCurrentAssignmentId } =
    useAssignmentStore();

  const [loading, setLoading] = useState(true);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useWebSocket(assignmentId);

  useEffect(() => {
    setCurrentAssignmentId(assignmentId);
    loadAssignment();
  }, [assignmentId, setCurrentAssignmentId]);

  const loadAssignment = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/assignments/${assignmentId}`
      );
      const data = await response.json();
      setGenerationStatus(data.status);

      if (data.status === 'completed') {
        await fetchPaper(assignmentId);
      }
    } catch (error) {
      console.error('Failed to load assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!currentPaper) return;

    setDownloading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/papers/${currentPaper._id}/download`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentPaper.paperTitle || 'question-paper'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/papers/${assignmentId}/regenerate`, {
        method: 'POST',
      });
      setGenerationStatus('pending');
      await loadAssignment();
    } catch (error) {
      console.error('Failed to regenerate:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/assignments" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium">
            <ArrowLeft size={18} />
            Create New
          </Link>

          <div className="flex gap-3">
            {generationStatus === 'completed' && currentPaper && (
              <>
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 disabled:bg-gray-700 text-sm font-medium border border-gray-700 transition-colors"
                >
                  <Download size={18} />
                  {downloading ? 'Downloading...' : 'Download as PDF'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Loading/Processing State */}
        {generationStatus !== 'completed' && (
          <div className="max-w-4xl mx-auto mb-8">
            {generationStatus === 'pending' && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
                <div className="inline-block p-3 bg-gray-800 rounded-full mb-4">
                  <Loader className="text-orange-500 animate-spin" size={24} />
                </div>
                <p className="text-white font-medium">Your question paper is being generated...</p>
                <p className="text-gray-400 text-sm mt-1">This may take a minute</p>
              </div>
            )}
            {generationStatus === 'processing' && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
                <div className="inline-block p-3 bg-gray-800 rounded-full mb-4">
                  <Loader className="text-orange-500 animate-spin" size={24} />
                </div>
                <p className="text-white font-medium">Generating questions...</p>
                <p className="text-gray-400 text-sm mt-1">Processing your request</p>
              </div>
            )}
          </div>
        )}

        {/* Question Paper */}
        {generationStatus === 'completed' && currentPaper && (
          <div className="max-w-4xl mx-auto bg-gray-900 rounded-lg border border-gray-800 p-12">
            {/* Header Section */}
            <div className="text-center mb-8 pb-8 border-b border-gray-700">
              <h1 className="text-2xl font-bold text-white mb-2">Delhi Public School, Sector-4, Bokaro</h1>
              <p className="text-lg text-gray-300 mb-1">Subject: {currentPaper.subject}</p>
              <p className="text-lg text-gray-300 mb-6">Class: {currentPaper.class || '10'}</p>

              <div className="flex justify-between text-sm text-gray-400">
                <span>Time Allowed: {currentPaper.duration}</span>
                <span>Maximum Marks: {currentPaper.maxMarks}</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-gray-300 text-sm">All questions are compulsory unless otherwise stated.</p>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-3 gap-8 mb-12 text-sm">
              <div className="border-b border-gray-700 pb-2">
                <span className="text-gray-400">Name: </span>
                <span className="text-gray-300 ml-4">_________________________</span>
              </div>
              <div className="border-b border-gray-700 pb-2">
                <span className="text-gray-400">Roll Number: </span>
                <span className="text-gray-300 ml-4">_________________________</span>
              </div>
              <div className="border-b border-gray-700 pb-2">
                <span className="text-gray-400">Class/Section: </span>
                <span className="text-gray-300 ml-4">_________________________</span>
              </div>
            </div>

            {/* Sections & Questions */}
            {currentPaper.sections.map((section, sectionIdx) => (
              <div key={sectionIdx} className="mb-12">
                <h2 className="text-lg font-bold bg-gray-800 text-white p-3 rounded-lg mb-6">
                  {section.title}
                </h2>
                <p className="text-gray-400 text-sm italic mb-6">{section.instruction}</p>

                {section.questions.map((question, qIdx) => (
                  <div key={qIdx} className="mb-8 pb-6 border-b border-gray-700 last:border-b-0">
                    <div className="flex gap-4">
                      <span className="font-bold text-white min-w-fit">{question.number}.</span>
                      <div className="flex-1">
                        <p className="text-gray-200 mb-3">{question.text}</p>

                        {/* MCQ Options */}
                        {question.options && question.options.length > 0 && (
                          <div className="ml-4 space-y-2 mb-4">
                            {question.options.map((option, optIdx) => (
                              <p key={optIdx} className="text-gray-300 text-sm">
                                ({String.fromCharCode(97 + optIdx)}) {option}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Marks and Difficulty */}
                        <div className="flex gap-4 items-center">
                          <span className="font-semibold text-white text-sm">[{question.marks} marks]</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Answer Key */}
            <div className="mt-12 pt-8 border-t border-gray-700">
              <button
                onClick={() => setShowAnswerKey(!showAnswerKey)}
                className="text-orange-500 font-semibold text-sm hover:text-orange-400 transition-colors flex items-center gap-2 mb-6"
              >
                <span>{showAnswerKey ? '▼' : '▶'}</span>
                Answer Key
              </button>

              {showAnswerKey && (
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <div className="grid grid-cols-2 gap-6">
                    {currentPaper.answerKey.map((item, idx) => (
                      <div key={idx} className="flex gap-4">
                        <span className="font-semibold text-white min-w-fit">{item.questionId}:</span>
                        <span className="text-gray-300">{item.answer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Regenerate Button */}
            <div className="mt-8 pt-8 border-t border-gray-700 flex justify-end">
              <button
                onClick={handleRegenerate}
                className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-900 text-sm font-medium border border-gray-700 transition-colors"
              >
                <RefreshCw size={18} />
                Regenerate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
