import { Router } from 'express';
import { db } from '../db/index.js';
import { jobs, applicationSubmissions } from '../db/schema.js';
import { eq, desc, gte, or, sql } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/jobs/applied
 * Get all applied jobs with their submission data
 */
router.get('/applied', async (_req, res) => {
  try {
    const appliedJobs = await db
      .select()
      .from(jobs)
      .where(eq(jobs.status, 'applied'))
      .orderBy(sql`COALESCE(${jobs.postedAt}, ${jobs.createdAt}) DESC NULLS LAST`);

    res.json(appliedJobs);
    return;
  } catch (error) {
    console.error('Error fetching applied jobs:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_APPLIED_JOBS_ERROR',
        message: 'Failed to fetch applied jobs',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
});

/**
 * GET /api/jobs
 * Get all jobs with optional filtering
 * Query params:
 *   - status: Filter by job status (new, rejected, approved, applied)
 *   - minScore: Filter by minimum match score
 */
router.get('/', async (req, res) => {
  try {
    const { status, minScore } = req.query;

    let results;

    // Sort by postedAt if available, otherwise createdAt (COALESCE handles NULL)
    const sortByDate = sql`COALESCE(${jobs.postedAt}, ${jobs.createdAt}) DESC NULLS LAST`;

    // Filter by status if provided
    if (status && typeof status === 'string') {
      const validStatuses = ['new', 'rejected', 'approved', 'applied'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          error: {
            code: 'INVALID_STATUS',
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            retryable: false,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // For 'applied' and 'rejected' jobs, show all regardless of age
      // For 'new' and 'approved', only show jobs from last 24 hours (STRICTER)
      if (status === 'applied' || status === 'rejected') {
        results = await db
          .select()
          .from(jobs)
          .where(eq(jobs.status, status as 'applied' | 'rejected'))
          .orderBy(sortByDate, desc(jobs.matchScore));
      } else {
        // Calculate cutoff date (24 hours ago) for new/approved jobs - STRICTER
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - 24);

        const freshnessFilter = or(
          gte(jobs.postedAt, cutoffDate),
          sql`${jobs.postedAt} IS NULL AND ${jobs.createdAt} >= ${cutoffDate}`
        );

        results = await db
          .select()
          .from(jobs)
          .where(sql`${eq(jobs.status, status as 'new' | 'approved')} AND (${freshnessFilter})`)
          .orderBy(sortByDate, desc(jobs.matchScore));
      }
    } else {
      // No status filter - show only fresh jobs (new/approved from last 24 hours)
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - 24);

      const freshnessFilter = or(
        gte(jobs.postedAt, cutoffDate),
        sql`${jobs.postedAt} IS NULL AND ${jobs.createdAt} >= ${cutoffDate}`
      );

      results = await db
        .select()
        .from(jobs)
        .where(freshnessFilter)
        .orderBy(sortByDate, desc(jobs.matchScore));
    }

    // Filter by minScore if provided (done in-memory since matchScore can be null)
    if (minScore !== undefined) {
      const minScoreNum = parseInt(minScore as string, 10);
      if (isNaN(minScoreNum)) {
        res.status(400).json({
          error: {
            code: 'INVALID_MIN_SCORE',
            message: 'minScore must be a valid number',
            retryable: false,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }
      results = results.filter((job) => job.matchScore !== null && job.matchScore >= minScoreNum);
    }

    res.json(results);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to retrieve jobs',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
});

/**
 * PATCH /api/jobs/:id/status
 * Update job status
 * Body: { status: 'new' | 'rejected' | 'approved' | 'applied' }
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const jobId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (isNaN(jobId)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_JOB_ID',
          message: 'Job ID must be a valid number',
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate status
    const validStatuses = ['new', 'rejected', 'approved', 'applied'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Get current job to validate state transition
    const [currentJob] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);

    if (!currentJob) {
      return res.status(404).json({
        error: {
          code: 'JOB_NOT_FOUND',
          message: `Job with ID ${jobId} not found`,
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate state transitions (Property 11: Job Status State Machine)
    const validTransitions: Record<string, string[]> = {
      new: ['approved', 'rejected'],
      approved: ['applied', 'approved'], // Can stay approved if automation cancelled
      rejected: [], // Terminal state
      applied: [], // Terminal state
    };

    const allowedNextStates = validTransitions[currentJob.status];
    if (!allowedNextStates.includes(status)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATE_TRANSITION',
          message: `Cannot transition from '${currentJob.status}' to '${status}'`,
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Update status
    const [updated] = await db
      .update(jobs)
      .set({ status: status as 'new' | 'rejected' | 'approved' | 'applied' })
      .where(eq(jobs.id, jobId))
      .returning();

    res.json(updated);
    return;
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update job status',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
});

/**
 * POST /api/jobs/:id/apply
 * Trigger automation engine for a job
 * Returns automation session ID
 */
router.post('/:id/apply', async (req, res) => {
  try {
    const jobId = parseInt(req.params.id, 10);

    if (isNaN(jobId)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_JOB_ID',
          message: 'Job ID must be a valid number',
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Verify job exists and is in 'approved' status
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);

    if (!job) {
      return res.status(404).json({
        error: {
          code: 'JOB_NOT_FOUND',
          message: `Job with ID ${jobId} not found`,
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (job.status !== 'approved') {
      return res.status(400).json({
        error: {
          code: 'INVALID_JOB_STATUS',
          message: `Job must be in 'approved' status to apply. Current status: ${job.status}`,
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Redirect to automation start endpoint
    res.json({
      message: 'Use POST /api/automation/start with { jobId } to start automation',
      jobId,
    });
    return;
  } catch (error) {
    console.error('Error triggering automation:', error);
    res.status(500).json({
      error: {
        code: 'AUTOMATION_ERROR',
        message: 'Failed to trigger automation',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
});

/**
 * POST /api/jobs/rescore
 * Rescore all jobs that don't have a match score
 * Useful when profile is created after jobs are scraped
 */
router.post('/rescore', async (_req, res) => {
  try {
    // Import scoring service and profile
    const { scoreJob } = await import('../services/scoringService.js');
    const { userProfile } = await import('../db/schema.js');

    // Get user profile
    const profiles = await db.select().from(userProfile).limit(1);
    if (profiles.length === 0) {
      return res.status(400).json({
        error: {
          code: 'NO_PROFILE',
          message: 'User profile not found. Please create a profile first.',
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const profile = profiles[0];

    // Get all jobs without match scores
    const jobsToScore = await db
      .select()
      .from(jobs)
      .where(sql`${jobs.matchScore} IS NULL`);

    if (jobsToScore.length === 0) {
      return res.json({
        message: 'All jobs already have match scores',
        scoredCount: 0,
        totalJobs: 0,
      });
    }

    console.log(`Rescoring ${jobsToScore.length} jobs...`);

    let scoredCount = 0;
    let failedCount = 0;

    // Score each job
    for (const job of jobsToScore) {
      try {
        console.log(`Scoring: ${job.company} - ${job.title}`);
        const score = await scoreJob(job.description, profile.resumeText);

        if (score !== null) {
          await db.update(jobs).set({ matchScore: score }).where(eq(jobs.id, job.id));
          scoredCount++;
          console.log(`✓ Scored ${job.title}: ${score}/100`);
        } else {
          failedCount++;
          console.warn(`✗ Failed to score ${job.title}`);
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        failedCount++;
        console.error(`Error scoring job ${job.id}:`, error);
      }
    }

    res.json({
      message: 'Rescoring completed',
      scoredCount,
      failedCount,
      totalJobs: jobsToScore.length,
    });
    return;
  } catch (error) {
    console.error('Error rescoring jobs:', error);
    res.status(500).json({
      error: {
        code: 'RESCORE_ERROR',
        message: 'Failed to rescore jobs',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
});

export default router;
