const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
    ? 'https://horizon-job-filer.onrender.com' 
    : 'http://localhost:3001');

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
  postedDate: string;
  matchScore?: number;
  status: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  skills: string[];
  experience: string;
  education: string;
  preferences: {
    locations: string[];
    jobTypes: string[];
    salaryRange: { min: number; max: number };
  };
  resumeUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const api = {
  // Jobs
  async getJobs(params?: { status?: string; minScore?: number; limit?: number }): Promise<Job[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.minScore) queryParams.append('minScore', params.minScore.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_BASE_URL}/api/jobs?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch jobs');
    return response.json();
  },

  async getJob(id: string): Promise<Job> {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${id}`);
    if (!response.ok) throw new Error('Failed to fetch job');
    return response.json();
  },

  async updateJobStatus(id: string, status: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update job status');
    return response.json();
  },

  // Profile
  async getProfile(): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/api/profile`);
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  },

  async uploadResume(file: File): Promise<{ message: string; url: string }> {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await fetch(`${API_BASE_URL}/api/profile/resume`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload resume');
    return response.json();
  },

  // Automation
  async startAutomation(config: {
    searchQuery: string;
    maxJobs: number;
    autoApply: boolean;
  }): Promise<{ message: string; jobId: string }> {
    const response = await fetch(`${API_BASE_URL}/api/automation/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!response.ok) throw new Error('Failed to start automation');
    return response.json();
  },

  async stopAutomation(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/automation/stop`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to stop automation');
    return response.json();
  },

  async getAutomationStatus(): Promise<{
    isRunning: boolean;
    currentJob?: string;
    progress?: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/api/automation/status`);
    if (!response.ok) throw new Error('Failed to fetch automation status');
    return response.json();
  },
};
