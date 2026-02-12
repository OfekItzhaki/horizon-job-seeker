import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Horizon Job Filer API',
      version: '1.0.0',
      description: 'Intelligent job search automation platform API',
      contact: {
        name: 'API Support',
        url: 'https://github.com/yourusername/horizon-job-filer',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.BACKEND_URL || 'http://localhost:3001',
        description:
          process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      schemas: {
        Job: {
          type: 'object',
          required: ['id', 'jobUrl', 'company', 'title', 'description', 'status', 'createdAt'],
          properties: {
            id: {
              type: 'integer',
              description: 'Job ID',
              example: 1,
            },
            jobUrl: {
              type: 'string',
              format: 'uri',
              description: 'URL to the job posting',
              example: 'https://www.linkedin.com/jobs/view/123456',
            },
            company: {
              type: 'string',
              description: 'Company name',
              example: 'Tech Corp',
            },
            title: {
              type: 'string',
              description: 'Job title',
              example: 'Senior Full Stack Developer',
            },
            description: {
              type: 'string',
              description: 'Job description',
              example: 'We are looking for an experienced developer...',
            },
            matchScore: {
              type: 'integer',
              nullable: true,
              minimum: 0,
              maximum: 100,
              description: 'AI-calculated match score (0-100)',
              example: 85,
            },
            status: {
              type: 'string',
              enum: ['new', 'rejected', 'approved', 'applied'],
              description: 'Job application status',
              example: 'new',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Job creation timestamp',
              example: '2026-02-11T12:00:00.000Z',
            },
          },
        },
        UserProfile: {
          type: 'object',
          required: ['id', 'fullName', 'email', 'resumeText', 'createdAt', 'updatedAt'],
          properties: {
            id: {
              type: 'integer',
              description: 'Profile ID',
              example: 1,
            },
            fullName: {
              type: 'string',
              description: 'Full name',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address',
              example: 'john.doe@example.com',
            },
            phone: {
              type: 'string',
              nullable: true,
              description: 'Phone number',
              example: '+1234567890',
            },
            githubUrl: {
              type: 'string',
              format: 'uri',
              nullable: true,
              description: 'GitHub profile URL',
              example: 'https://github.com/johndoe',
            },
            linkedinUrl: {
              type: 'string',
              format: 'uri',
              nullable: true,
              description: 'LinkedIn profile URL',
              example: 'https://linkedin.com/in/johndoe',
            },
            location: {
              type: 'string',
              nullable: true,
              description: 'Location',
              example: 'San Francisco, CA',
            },
            resumeText: {
              type: 'string',
              description: 'Resume text content',
              example: 'Experienced software engineer with 5+ years...',
            },
            bio: {
              type: 'string',
              nullable: true,
              description: 'Professional summary',
              example: 'Passionate about building scalable applications...',
            },
            structuredData: {
              type: 'object',
              nullable: true,
              description: 'AI-parsed structured resume data',
            },
            desiredJobTitles: {
              type: 'string',
              nullable: true,
              description: 'Comma-separated desired job titles',
              example: 'Senior Developer, Lead Engineer',
            },
            desiredLocations: {
              type: 'string',
              nullable: true,
              description: 'Comma-separated desired locations',
              example: 'San Francisco, Remote, New York',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Profile creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Profile last update timestamp',
            },
          },
        },
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'object',
              required: ['code', 'message', 'retryable', 'timestamp'],
              properties: {
                code: {
                  type: 'string',
                  description: 'Error code',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  description: 'Error message',
                  example: 'Invalid input provided',
                },
                details: {
                  type: 'string',
                  description: 'Detailed error information',
                  example: 'Field "email" is required',
                },
                retryable: {
                  type: 'boolean',
                  description: 'Whether the request can be retried',
                  example: false,
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Error timestamp',
                  example: '2026-02-11T12:00:00.000Z',
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Jobs',
        description: 'Job management endpoints',
      },
      {
        name: 'Profile',
        description: 'User profile management endpoints',
      },
      {
        name: 'Automation',
        description: 'Job application automation endpoints',
      },
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
    ],
  },
  apis: ['./src/api/*.ts', './src/index.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
