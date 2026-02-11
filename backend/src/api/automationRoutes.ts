import { Router } from 'express';
import { automationEngine } from '../automation/automationEngine.js';

const router = Router();

/**
 * POST /api/automation/start
 * Start automation for a job
 * Body: { jobId: number }
 */
router.post('/start', async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId || typeof jobId !== 'number') {
      return res.status(400).json({
        error: {
          code: 'INVALID_JOB_ID',
          message: 'jobId is required and must be a number',
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Start automation session
    const session = await automationEngine.startSession(jobId);

    // Fill form with profile data
    await automationEngine.fillFormWithProfile(session.id);

    // Pause at submit button
    await automationEngine.pauseAtSubmit(session.id);

    res.json({
      automationId: session.id,
      jobId: session.jobId,
      status: session.status,
      message: 'Automation paused at submit button. Please review and confirm.',
    });
    return;
  } catch (error) {
    console.error('Error starting automation:', error);
    res.status(500).json({
      error: {
        code: 'AUTOMATION_START_ERROR',
        message: 'Failed to start automation',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
});

/**
 * POST /api/automation/confirm
 * Confirm submission and click submit button
 * Body: { automationId: string }
 */
router.post('/confirm', async (req, res) => {
  try {
    const { automationId } = req.body;

    if (!automationId || typeof automationId !== 'string') {
      return res.status(400).json({
        error: {
          code: 'INVALID_AUTOMATION_ID',
          message: 'automationId is required and must be a string',
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Verify session exists
    const session = automationEngine.getSession(automationId);
    if (!session) {
      return res.status(404).json({
        error: {
          code: 'SESSION_NOT_FOUND',
          message: `Automation session ${automationId} not found`,
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Confirm submission
    await automationEngine.confirmSubmission(automationId);

    res.json({
      success: true,
      automationId,
      message: 'Application submitted successfully',
    });
    return;
  } catch (error) {
    console.error('Error confirming submission:', error);
    res.status(500).json({
      error: {
        code: 'SUBMISSION_ERROR',
        message: 'Failed to confirm submission',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
});

/**
 * POST /api/automation/cancel
 * Cancel automation session
 * Body: { automationId: string }
 */
router.post('/cancel', async (req, res) => {
  try {
    const { automationId } = req.body;

    if (!automationId || typeof automationId !== 'string') {
      return res.status(400).json({
        error: {
          code: 'INVALID_AUTOMATION_ID',
          message: 'automationId is required and must be a string',
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Verify session exists
    const session = automationEngine.getSession(automationId);
    if (!session) {
      return res.status(404).json({
        error: {
          code: 'SESSION_NOT_FOUND',
          message: `Automation session ${automationId} not found`,
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Cancel session
    await automationEngine.cancelSession(automationId);

    res.json({
      success: true,
      automationId,
      message: 'Automation cancelled successfully',
    });
    return;
  } catch (error) {
    console.error('Error cancelling automation:', error);
    res.status(500).json({
      error: {
        code: 'CANCEL_ERROR',
        message: 'Failed to cancel automation',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
});

/**
 * POST /api/automation/kill
 * Emergency kill switch - terminate all active sessions
 */
router.post('/kill', async (_req, res) => {
  try {
    console.log('🔴 Kill switch activated via API');

    const terminated = await automationEngine.killAllSessions();

    res.json({
      success: true,
      terminated,
      message: `Kill switch activated. Terminated ${terminated} session(s).`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error activating kill switch:', error);
    res.status(500).json({
      error: {
        code: 'KILL_SWITCH_ERROR',
        message: 'Failed to activate kill switch',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/automation/sessions
 * Get all active automation sessions
 */
router.get('/sessions', (_req, res) => {
  try {
    const sessions = automationEngine.getAllSessions();

    const sessionData = sessions.map((s) => ({
      id: s.id,
      jobId: s.jobId,
      status: s.status,
      createdAt: s.createdAt,
    }));

    res.json({
      sessions: sessionData,
      count: sessionData.length,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_SESSIONS_ERROR',
        message: 'Failed to fetch automation sessions',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
