'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import AutomationModal from './components/AutomationModal';

interface Job {
  id: number;
  jobUrl: string;
  company: string;
  title: string;
  description: string;
  matchScore: number | null;
  status: 'new' | 'rejected' | 'approved' | 'applied';
  postedAt: string | null;
  createdAt: string;
}

interface AutomationUpdate {
  type:
    | 'automation_started'
    | 'automation_filling'
    | 'automation_paused'
    | 'automation_submitted'
    | 'automation_cancelled'
    | 'automation_error';
  automationId: string;
  jobId: number;
  message: string;
  timestamp: string;
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'new' | 'all' | 'applied'>('new');
  const [refreshing, setRefreshing] = useState(false);

  // Automation modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [automationStatus, setAutomationStatus] = useState<
    'filling' | 'paused' | 'submitted' | 'error' | null
  >(null);
  const [automationMessage, setAutomationMessage] = useState('');
  const [currentJobTitle, setCurrentJobTitle] = useState('');
  const [currentAutomationId, setCurrentAutomationId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';

  useEffect(() => {
    fetchJobs();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connected') {
            console.log('WebSocket connection confirmed');
            return;
          }

          handleAutomationUpdate(data as AutomationUpdate);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  };

  const handleAutomationUpdate = (update: AutomationUpdate) => {
    console.log('Automation update:', update);

    // Find the job
    const job = jobs.find((j) => j.id === update.jobId);
    if (job) {
      setCurrentJobTitle(`${job.company} - ${job.title}`);
    }

    setCurrentAutomationId(update.automationId);
    setAutomationMessage(update.message);

    switch (update.type) {
      case 'automation_started':
        setModalOpen(true);
        setAutomationStatus('filling');
        break;
      case 'automation_filling':
        setModalOpen(true);
        setAutomationStatus('filling');
        break;
      case 'automation_paused':
        setModalOpen(true);
        setAutomationStatus('paused');
        break;
      case 'automation_submitted':
        setAutomationStatus('submitted');
        fetchJobs(); // Refresh jobs list
        setTimeout(() => {
          setModalOpen(false);
          setAutomationStatus(null);
        }, 3000);
        break;
      case 'automation_cancelled':
        setModalOpen(false);
        setAutomationStatus(null);
        break;
      case 'automation_error':
        setModalOpen(true);
        setAutomationStatus('error');
        break;
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      let url;

      if (filter === 'applied') {
        url = `${API_URL}/api/jobs/applied`;
      } else if (filter === 'new') {
        url = `${API_URL}/api/jobs?status=new`;
      } else {
        url = `${API_URL}/api/jobs`;
      }

      const response = await fetch(url);
      const data = await response.json();

      // Sort by match score descending
      const sorted = data.sort((a: Job, b: Job) => {
        if (a.matchScore === null) return 1;
        if (b.matchScore === null) return -1;
        return b.matchScore - a.matchScore;
      });

      setJobs(sorted);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = async (jobId: number) => {
    try {
      // Update status to approved
      await fetch(`${API_URL}/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      // Refresh jobs list
      fetchJobs();

      alert('Job approved! You can now start automation from the approved jobs list.');
    } catch (error) {
      console.error('Error approving job:', error);
      alert('Failed to approve job');
    }
  };

  const handleDismiss = async (jobId: number) => {
    try {
      await fetch(`${API_URL}/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });

      // Refresh jobs list
      fetchJobs();
    } catch (error) {
      console.error('Error dismissing job:', error);
      alert('Failed to dismiss job');
    }
  };

  const handleConfirmSubmission = async () => {
    if (!currentAutomationId) return;

    try {
      await fetch(`${API_URL}/api/automation/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ automationId: currentAutomationId }),
      });
    } catch (error) {
      console.error('Error confirming submission:', error);
      alert('Failed to confirm submission');
    }
  };

  const handleCancelAutomation = async () => {
    if (!currentAutomationId) {
      setModalOpen(false);
      return;
    }

    try {
      await fetch(`${API_URL}/api/automation/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ automationId: currentAutomationId }),
      });

      setModalOpen(false);
      setAutomationStatus(null);
    } catch (error) {
      console.error('Error cancelling automation:', error);
      alert('Failed to cancel automation');
    }
  };

  const handleKillSwitch = async () => {
    if (!confirm('⚠️ This will immediately stop ALL automation sessions. Are you sure?')) {
      return;
    }

    try {
      await fetch(`${API_URL}/api/automation/kill`, {
        method: 'POST',
      });

      setModalOpen(false);
      setAutomationStatus(null);
      alert('Kill switch activated - all automation stopped');
    } catch (error) {
      console.error('Error activating kill switch:', error);
      alert('Failed to activate kill switch');
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  const handleRefreshJobs = async () => {
    if (refreshing) return;

    if (
      !confirm(
        'This will scrape new jobs from multiple sources. It may take 1-2 minutes. Continue?'
      )
    ) {
      return;
    }

    try {
      setRefreshing(true);

      // Set a 3-minute timeout for the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes

      const response = await fetch(`${API_URL}/api/automation/scrape`, {
        method: 'POST',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to trigger job scraping');
      }

      const data = await response.json();

      alert(
        `✓ Job scraping completed!\n\nNew jobs found: ${data.newJobsCount || 0}\nDuplicates skipped: ${data.duplicatesCount || 0}\nTotal scraped: ${data.totalScraped || 0}`
      );

      // Refresh the jobs list
      await fetchJobs();
    } catch (error) {
      console.error('Error refreshing jobs:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        alert(
          'Job scraping timed out. The scraping may still be running in the background. Please wait a moment and refresh the page.'
        );
      } else {
        alert('Failed to refresh jobs. Please try again.');
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Automation Modal */}
      <AutomationModal
        isOpen={modalOpen}
        status={automationStatus}
        message={automationMessage}
        jobTitle={currentJobTitle}
        onConfirm={handleConfirmSubmission}
        onCancel={handleCancelAutomation}
        onKillSwitch={handleKillSwitch}
      />

      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Job Search Agent</h1>
            <div className="flex gap-3">
              <button
                onClick={handleRefreshJobs}
                disabled={refreshing}
                className={`px-4 py-2 rounded-lg transition font-medium ${
                  refreshing
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {refreshing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Refreshing...
                  </span>
                ) : (
                  '🔄 Refresh Jobs'
                )}
              </button>
              <Link
                href="/profile"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                My Profile
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setFilter('new')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                filter === 'new'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              New Jobs
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                filter === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Jobs
            </button>
            <button
              onClick={() => setFilter('applied')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                filter === 'applied'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Applied Jobs
            </button>
          </nav>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading jobs...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && jobs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Run the background worker to scrape jobs from LinkedIn and Indeed.
            </p>
          </div>
        )}

        {/* Jobs List */}
        {!loading && jobs.length > 0 && (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
                      {job.matchScore !== null && (
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            job.matchScore >= 80
                              ? 'bg-green-100 text-green-800'
                              : job.matchScore >= 60
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {job.matchScore}% Match
                        </span>
                      )}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          job.status === 'new'
                            ? 'bg-blue-100 text-blue-800'
                            : job.status === 'approved'
                              ? 'bg-purple-100 text-purple-800'
                              : job.status === 'applied'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <p className="text-gray-600 font-medium mb-2">{job.company}</p>
                    <p className="text-gray-500 text-xs mb-2">
                      {job.postedAt
                        ? `Posted ${formatTimeAgo(job.postedAt)}`
                        : `Scraped ${formatTimeAgo(job.createdAt)}`}
                    </p>
                    <p className="text-gray-700 text-sm line-clamp-3 mb-4">{job.description}</p>
                    <a
                      href={job.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Job →
                    </a>
                  </div>

                  {/* Action Buttons */}
                  {job.status === 'new' && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleProceed(job.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                      >
                        Proceed
                      </button>
                      <button
                        onClick={() => handleDismiss(job.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
