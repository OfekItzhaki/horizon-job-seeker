# Database Property Tests

This directory contains property-based tests for database constraints using fast-check.

## Tests Included

### Property 16: Database Unique Constraint Enforcement
Tests that the unique constraint on the `job_url` column is properly enforced:
- Attempting to insert duplicate job URLs should fail
- Inserting jobs with unique URLs should succeed
- **Validates: Requirements 8.2**

### Property 17: Status ENUM Constraint Enforcement
Tests that the ENUM constraint on the `status` column is properly enforced:
- Attempting to set invalid status values should fail
- All valid status values ('new', 'rejected', 'approved', 'applied') should be accepted
- Updating to invalid status should fail
- **Validates: Requirements 8.3**

## Setup Requirements

### 1. Database Connection

Set the `DATABASE_URL` environment variable to point to your test database:

```bash
# For local PostgreSQL
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/job_search_agent_test"

# For Supabase
export DATABASE_URL="postgresql://user:password@db.xxx.supabase.co:5432/postgres"
```

Or create a `.env` file in the backend directory:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/job_search_agent_test
```

### 2. Run Migrations

Ensure the database schema is created by running migrations:

```bash
npm run db:migrate
```

### 3. Run Tests

Run the property tests:

```bash
# Run all tests
npm test

# Run only database constraint tests
npx vitest run src/db/schema.test.ts
```

## Test Configuration

- **Test Framework**: Vitest
- **Property Testing Library**: fast-check
- **Number of Runs**: 100 iterations per property (50 for some complex tests)
- **Database**: PostgreSQL (local or Supabase)

## Troubleshooting

### Connection Refused Error

If you see `ECONNREFUSED` errors:
1. Verify PostgreSQL is running (for local setup)
2. Check that DATABASE_URL is correctly set
3. Verify network connectivity to Supabase (for cloud setup)
4. Ensure the database exists and is accessible

### Schema Not Found Error

If you see table or column not found errors:
1. Run migrations: `npm run db:migrate`
2. Verify the schema matches the expected structure
3. Check that you're connecting to the correct database

### Test Failures

If tests fail:
1. Check that the database is clean before running tests
2. Verify that constraints are properly defined in the schema
3. Review the error messages for specific constraint violations
4. Ensure you're using a test database (not production!)

## Notes

- These tests use a real database connection (not mocks) to verify actual constraint enforcement
- Tests clean up after themselves by deleting all jobs before each test
- Each property test runs 100 times with randomized inputs to ensure robustness
- Tests follow the design document's requirement for property-based testing with fast-check
