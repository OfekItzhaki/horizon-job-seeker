/**
 * Generates a canonical ID from company name and job title
 * to prevent duplicate job entries.
 *
 * @param company - Company name
 * @param title - Job title
 * @returns Canonical ID in format: "company-slug__job-title-slug"
 */
export function generateCanonicalId(company: string, title: string): string {
  const normalize = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const companySlug = normalize(company);
  const titleSlug = normalize(title);

  return `${companySlug}__${titleSlug}`;
}
