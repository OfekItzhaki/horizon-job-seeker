'use client';

interface AutomationModalProps {
  isOpen: boolean;
  status: 'filling' | 'paused' | 'submitted' | 'error' | null;
  message: string;
  jobTitle?: string;
  onConfirm: () => void;
  onCancel: () => void;
  onKillSwitch: () => void;
}

export default function AutomationModal({
  isOpen,
  status,
  message,
  jobTitle,
  onConfirm,
  onCancel,
  onKillSwitch,
}: AutomationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Automation Status
          </h2>
          {status !== 'submitted' && (
            <button
              onClick={onKillSwitch}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition font-medium"
              title="Emergency stop - closes all automation"
            >
              🔴 Kill Switch
            </button>
          )}
        </div>

        {/* Job Title */}
        {jobTitle && (
          <p className="text-sm text-gray-600 mb-4">
            Job: {jobTitle}
          </p>
        )}

        {/* Status Indicator */}
        <div className="mb-6">
          {status === 'filling' && (
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div>
                <p className="font-medium text-gray-900">Filling form...</p>
                <p className="text-sm text-gray-600">{message}</p>
              </div>
            </div>
          )}

          {status === 'paused' && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-xl">⏸</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Ready to submit</p>
                <p className="text-sm text-gray-600">{message}</p>
              </div>
            </div>
          )}

          {status === 'submitted' && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xl">✓</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Application submitted!</p>
                <p className="text-sm text-gray-600">{message}</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xl">✕</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Error occurred</p>
                <p className="text-sm text-gray-600">{message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {status === 'paused' && (
            <>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                Confirm Submission
              </button>
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
              >
                Cancel
              </button>
            </>
          )}

          {status === 'submitted' && (
            <button
              onClick={onCancel}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Close
            </button>
          )}

          {status === 'error' && (
            <button
              onClick={onCancel}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
            >
              Close
            </button>
          )}

          {status === 'filling' && (
            <button
              onClick={onCancel}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
            >
              Cancel Automation
            </button>
          )}
        </div>

        {/* Safety Notice */}
        {status === 'paused' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              ⚠️ Please review the filled form in the browser window before confirming submission.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
