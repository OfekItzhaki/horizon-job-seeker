import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Score a job against a user's resume using GPT-4o-mini
 * @param jobDescription - The job description text
 * @param resumeText - The user's resume text
 * @param retries - Number of retry attempts (default: 3)
 * @returns Match score between 0-100, or null if scoring fails
 */
export async function scoreJob(
  jobDescription: string,
  resumeText: string,
  retries = 3
): Promise<number | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 5s, 10s, 20s
        const delay = 5000 * Math.pow(2, attempt - 1);
        console.log(`Retry attempt ${attempt + 1} after ${delay}ms delay`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    const prompt = `You are a job matching expert. Compare the following job description with the candidate's resume and provide a match score from 0 to 100.

Consider:
- Skills match (technical and soft skills)
- Experience level alignment
- Domain/industry relevance
- Role responsibilities match

Respond with ONLY a number between 0 and 100. No explanation needed.

Job Description:
${jobDescription}

Candidate Resume:
${resumeText}

Match Score (0-100):`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a job matching expert. Respond only with a number between 0 and 100.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 10,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      // Extract number from response
      const score = parseInt(content, 10);
      
      // Validate score is in range
      if (isNaN(score) || score < 0 || score > 100) {
        throw new Error(`Invalid score from OpenAI: ${content}`);
      }

      return score;
    } catch (error) {
      lastError = error as Error;
      console.error(`Scoring attempt ${attempt + 1} failed:`, error);
      
      // Don't retry on certain errors
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('api key') || message.includes('authentication')) {
          console.error('API key error - not retrying');
          return null;
        }
      }
    }
  }

  // All retries failed
  console.error('All scoring attempts failed:', lastError);
  return null;
}
