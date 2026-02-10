import { db } from './src/db/index.js';
import { jobs } from './src/db/schema.js';
import dotenv from 'dotenv';

dotenv.config();

async function insertTestJob() {
  console.log('📝 Inserting test job...');

  try {
    const [job] = await db.insert(jobs).values({
      jobUrl: 'https://www.linkedin.com/jobs/view/test-job-' + Date.now(),
      company: 'TechCorp Inc',
      title: 'Senior Full Stack Developer',
      description: `We are seeking an experienced Full Stack Developer to join our team.

Requirements:
- 5+ years of experience with React and Node.js
- Strong TypeScript skills
- Experience with PostgreSQL databases
- RESTful API design
- Git version control

Responsibilities:
- Build scalable web applications
- Design and implement APIs
- Collaborate with cross-functional teams
- Write clean, maintainable code

Benefits:
- Competitive salary
- Remote work options
- Health insurance
- Professional development budget`,
      matchScore: 85,
      status: 'new',
    }).returning();

    console.log('✅ Test job inserted successfully!');
    console.log(JSON.stringify(job, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inserting test job:', error);
    process.exit(1);
  }
}

insertTestJob();
