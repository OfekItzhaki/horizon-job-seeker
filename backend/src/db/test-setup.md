# Database Property Tests Setup Guide

This guide will help you set up and run the property-based tests for database constraints.

## Prerequisites

- PostgreSQL database (local or Supabase)
- Node.js and npm installed
- Backend dependencies installed (`npm install`)

## Step-by-Step Setup

### Option 1: Using Supabase (Recommended)

1. **Get your Supabase connection string**
   - Go to your Supabase project dashboard
   - Navigate to Settings > Database
   - Copy the connection string (URI format)
   - It should look like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`

2. **Create a .env file in the backend directory**
   ```bash
   cd backend
   touch .env  # or create manually on Windows
   ```

3. **Add the DATABASE_URL to .env**
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```

4. **Generate and run migrations**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Run the tests**
   ```bash
   npm test src/db/schema.test.ts
   ```

### Option 2: Using Local PostgreSQL

1. **Install PostgreSQL locally**
   - Download from https://www.postgresql.org/download/
   - Or use Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres`

2. **Create a test database**
   ```bash
   psql -U postgres
   CREATE DATABASE job_search_agent_test;
   \q
   ```

3. **Create a .env file in the backend directory**
   ```bash
   cd backend
   touch .env  # or create manually on Windows
   ```

4. **Add the DATABASE_URL to .env**
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/job_search_agent_test
   ```

5. **Generate and run migrations**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

6. **Run the tests**
   ```bash
   npm test src/db/schema.test.ts
   ```

## Verifying the Setup

To verify your database connection is working:

```bash
# Test the connection
node -e "import('postgres').then(m => { const sql = m.default(process.env.DATABASE_URL); sql\`SELECT 1\`.then(() => { console.log('✓ Database connection successful'); process.exit(0); }).catch(e => { console.error('✗ Connection failed:', e.message); process.exit(1); }); })"
```

## Running the Tests

### Run all tests
```bash
npm test
```

### Run only database constraint tests
```bash
npx vitest run src/db/schema.test.ts
```

### Run tests in watch mode
```bash
npx vitest watch src/db/schema.test.ts
```

## What the Tests Verify

### Property 16: Database Unique Constraint Enforcement
- ✓ Duplicate job URLs are rejected
- ✓ Unique job URLs are accepted
- ✓ Original records remain unchanged when duplicates are rejected

### Property 17: Status ENUM Constraint Enforcement
- ✓ Invalid status values are rejected
- ✓ All valid status values ('new', 'rejected', 'approved', 'applied') are accepted
- ✓ Updates to invalid status values are rejected

## Troubleshooting

### Error: "DATABASE_URL environment variable is not set"
- Make sure you created the .env file in the backend directory
- Verify the .env file contains the DATABASE_URL variable
- Try running with explicit env var: `DATABASE_URL=your-connection-string npm test`

### Error: "ECONNREFUSED"
- For local PostgreSQL: Verify PostgreSQL is running
- For Supabase: Check your internet connection and verify the connection string
- Test the connection using the verification command above

### Error: "relation 'jobs' does not exist"
- Run migrations: `npm run db:migrate`
- Verify migrations were generated: `npm run db:generate`
- Check that the drizzle folder exists with migration files

### Error: "password authentication failed"
- Verify your database password is correct
- For Supabase: Make sure you're using the correct password from your dashboard
- For local: Reset the password if needed

### Tests are failing
- Ensure you're using a test database (not production!)
- Try cleaning the database and re-running migrations
- Check that the schema matches the expected structure
- Review the specific error messages in the test output

## CI/CD Integration

For continuous integration, you can use a test database:

```yaml
# Example GitHub Actions workflow
env:
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: test_db
    ports:
      - 5432:5432
```

## Notes

- These tests use real database connections (not mocks) to verify actual constraint enforcement
- Each test run cleans up after itself
- Property tests run 100 iterations with randomized inputs
- Tests are safe to run multiple times
- Always use a separate test database, never production!
