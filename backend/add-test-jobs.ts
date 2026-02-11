#!/usr/bin/env tsx
/**
 * Add Test Jobs Script
 * This script adds multiple test jobs to the database for testing
 */

import { db } from './src/db/index.js';
import { jobs } from './src/db/schema.js';
import dotenv from 'dotenv';

dotenv.config();

const testJobs = [
  {
    jobUrl: `https://www.linkedin.com/jobs/view/test-job-${Date.now()}-1`,
    company: 'Google',
    title: 'Senior Software Engineer',
    description: `We are looking for a Senior Software Engineer to join our team.

Requirements:
- 5+ years of experience with JavaScript/TypeScript
- Strong experience with React and Node.js
- Experience with cloud platforms (GCP, AWS)
- Excellent problem-solving skills

Responsibilities:
- Design and implement scalable web applications
- Collaborate with cross-functional teams
- Mentor junior engineers
- Write clean, maintainable code

Benefits:
- Competitive salary ($150k-$200k)
- Stock options
- Remote work options
- Health insurance`,
    matchScore: 92,
    status: 'new' as const,
  },
  {
    jobUrl: `https://www.indeed.com/jobs/view/test-job-${Date.now()}-2`,
    company: 'Microsoft',
    title: 'Full Stack Developer',
    description: `Join Microsoft as a Full Stack Developer!

Requirements:
- 3+ years of experience with web development
- Proficiency in React, Node.js, and TypeScript
- Experience with Azure cloud services
- Strong communication skills

Responsibilities:
- Build and maintain web applications
- Work with product managers and designers
- Implement new features and improvements
- Participate in code reviews

Benefits:
- Competitive compensation
- Comprehensive health benefits
- Professional development opportunities
- Flexible work arrangements`,
    matchScore: 88,
    status: 'new' as const,
  },
  {
    jobUrl: `https://www.linkedin.com/jobs/view/test-job-${Date.now()}-3`,
    company: 'Amazon',
    title: 'Frontend Engineer',
    description: `Amazon is hiring a Frontend Engineer for our e-commerce platform.

Requirements:
- 4+ years of frontend development experience
- Expert knowledge of React and TypeScript
- Experience with responsive design
- Understanding of web performance optimization

Responsibilities:
- Develop user-facing features
- Optimize application performance
- Collaborate with UX designers
- Ensure cross-browser compatibility

Benefits:
- Competitive salary ($140k-$180k)
- RSUs (Restricted Stock Units)
- Relocation assistance
- Career growth opportunities`,
    matchScore: 85,
    status: 'new' as const,
  },
  {
    jobUrl: `https://www.indeed.com/jobs/view/test-job-${Date.now()}-4`,
    company: 'Meta',
    title: 'Backend Engineer',
    description: `Meta is looking for a Backend Engineer to work on our infrastructure.

Requirements:
- 5+ years of backend development experience
- Strong knowledge of Node.js, Python, or Java
- Experience with distributed systems
- Database design and optimization skills

Responsibilities:
- Design and implement backend services
- Optimize system performance and scalability
- Work on data pipelines and APIs
- Collaborate with frontend teams

Benefits:
- Excellent compensation package
- Stock options
- Free meals and snacks
- On-site gym and wellness programs`,
    matchScore: 78,
    status: 'new' as const,
  },
  {
    jobUrl: `https://www.linkedin.com/jobs/view/test-job-${Date.now()}-5`,
    company: 'Stripe',
    title: 'Staff Software Engineer',
    description: `Stripe is seeking a Staff Software Engineer for our payments platform.

Requirements:
- 7+ years of software engineering experience
- Deep expertise in TypeScript and Node.js
- Experience with payment systems or fintech
- Strong system design skills

Responsibilities:
- Lead technical initiatives
- Architect scalable solutions
- Mentor engineering teams
- Drive technical excellence

Benefits:
- Top-tier compensation ($180k-$250k)
- Equity package
- Remote-first culture
- Unlimited PTO`,
    matchScore: 95,
    status: 'new' as const,
  },
];

async function addTestJobs() {
  console.log('Adding test jobs to database...\n');

  try {
    for (const job of testJobs) {
      const [inserted] = await db.insert(jobs).values(job).returning();
      console.log(`✓ Added: ${inserted.company} - ${inserted.title} (Score: ${inserted.matchScore})`);
    }

    console.log(`\n✅ Successfully added ${testJobs.length} test jobs!`);
    console.log('\nYou can now:');
    console.log('1. Refresh your frontend to see the new jobs');
    console.log('2. Filter by "New" to see only new jobs');
    console.log('3. Approve jobs to test the automation workflow');
  } catch (error) {
    console.error('Error adding test jobs:', error);
    process.exit(1);
  }

  process.exit(0);
}

addTestJobs();
