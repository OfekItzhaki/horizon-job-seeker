// Feature: job-search-agent, Property 1: Canonical ID Determinism
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateCanonicalId } from './canonicalId.js';

describe('Canonical ID Generation', () => {
  describe('Property 1: Canonical ID Determinism', () => {
    it('should generate the same canonical ID for the same company and title', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (company, title) => {
            const id1 = generateCanonicalId(company, title);
            const id2 = generateCanonicalId(company, title);

            // Property: Same inputs always produce same output (determinism)
            expect(id1).toBe(id2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate the same canonical ID regardless of case', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (company, title) => {
            const id1 = generateCanonicalId(company.toLowerCase(), title.toLowerCase());
            const id2 = generateCanonicalId(company.toUpperCase(), title.toUpperCase());
            const id3 = generateCanonicalId(company, title);

            // Property: Case-insensitive (normalization)
            expect(id1).toBe(id2);
            expect(id1).toBe(id3);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate the same canonical ID regardless of special characters', () => {
      const testCases = [
        { company: 'Google Inc.', title: 'Software Engineer' },
        { company: 'Google Inc', title: 'Software Engineer' },
        { company: 'Google, Inc.', title: 'Software Engineer' },
        { company: 'Google  Inc', title: 'Software  Engineer' },
      ];

      const ids = testCases.map(({ company, title }) => generateCanonicalId(company, title));

      // All variations should produce the same canonical ID
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(1);
    });

    it('should handle edge cases correctly', () => {
      // Empty strings after normalization
      expect(generateCanonicalId('!!!', '???')).toBe('__');

      // Only special characters
      expect(generateCanonicalId('@#$%', '^&*()')).toBe('__');

      // Leading/trailing special characters
      expect(generateCanonicalId('...Google...', '---Engineer---')).toBe('google__engineer');

      // Multiple consecutive special characters
      expect(generateCanonicalId('Google   Inc', 'Software   Engineer')).toBe(
        'google-inc__software-engineer'
      );
    });

    it('should produce valid slugs (lowercase alphanumeric with hyphens)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (company, title) => {
            const id = generateCanonicalId(company, title);

            // Property: Output format is always valid (lowercase, alphanumeric, hyphens, double underscore separator)
            const validFormat = /^[a-z0-9-]*__[a-z0-9-]*$/;
            expect(id).toMatch(validFormat);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not have leading or trailing hyphens in slugs', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (company, title) => {
            const id = generateCanonicalId(company, title);
            const [companySlug, titleSlug] = id.split('__');

            // Property: No leading/trailing hyphens
            if (companySlug.length > 0) {
              expect(companySlug[0]).not.toBe('-');
              expect(companySlug[companySlug.length - 1]).not.toBe('-');
            }

            if (titleSlug.length > 0) {
              expect(titleSlug[0]).not.toBe('-');
              expect(titleSlug[titleSlug.length - 1]).not.toBe('-');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests - Specific Examples', () => {
    it('should generate correct canonical IDs for common cases', () => {
      expect(generateCanonicalId('Google', 'Software Engineer')).toBe('google__software-engineer');
      expect(generateCanonicalId('Meta', 'Full Stack Developer')).toBe(
        'meta__full-stack-developer'
      );
      expect(generateCanonicalId('Amazon Web Services', 'Senior Backend Engineer')).toBe(
        'amazon-web-services__senior-backend-engineer'
      );
    });

    it('should handle company names with special characters', () => {
      expect(generateCanonicalId('AT&T', 'Network Engineer')).toBe('at-t__network-engineer');
      expect(generateCanonicalId('Procter & Gamble', 'Product Manager')).toBe(
        'procter-gamble__product-manager'
      );
      expect(generateCanonicalId('3M Company', 'Research Scientist')).toBe(
        '3m-company__research-scientist'
      );
    });

    it('should handle job titles with special characters', () => {
      expect(generateCanonicalId('Google', 'C++ Developer')).toBe('google__c-developer');
      expect(generateCanonicalId('Microsoft', '.NET Engineer')).toBe('microsoft__net-engineer');
      expect(generateCanonicalId('Apple', 'iOS/Android Developer')).toBe(
        'apple__ios-android-developer'
      );
    });
  });
});
