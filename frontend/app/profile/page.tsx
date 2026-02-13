'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface WorkExperience {
  title: string;
  company: string;
  duration: string;
  responsibilities: string[];
  achievements: string[];
}

interface Education {
  degree: string;
  institution: string;
  year: string;
  details?: string;
}

interface StructuredProfileData {
  workExperience: WorkExperience[];
  skills: string[];
  education: Education[];
  certifications?: string[];
  languages?: string[];
}

interface UserProfile {
  id?: number;
  fullName: string;
  email: string;
  phone?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  location?: string;
  resumeText: string;
  bio?: string;
  structuredData?: StructuredProfileData | null;
  desiredJobTitles?: string;
  desiredLocations?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
    email: '',
    phone: '',
    githubUrl: '',
    linkedinUrl: '',
    location: '',
    resumeText: '',
    bio: '',
    desiredJobTitles: '',
    desiredLocations: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [inputMethod, setInputMethod] = useState<'resume' | 'manual'>('resume');
  const [showStructuredData, setShowStructuredData] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
      ? 'https://horizon-job-filer.onrender.com' 
      : 'http://localhost:3001');

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/profile`);

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        if (data.structuredData) {
          setShowStructuredData(true);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleParseResume = async () => {
    if (!profile.resumeText) {
      setMessage({ type: 'error', text: 'Please paste your resume first' });
      return;
    }

    try {
      setParsing(true);
      setMessage(null);

      const response = await fetch(`${API_URL}/api/profile/parse-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: profile.resumeText }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile({
          ...profile,
          structuredData: data.structuredData,
          desiredJobTitles: data.desiredJobTitles.join(', '),
        });
        setShowStructuredData(true);
        setMessage({
          type: 'success',
          text: 'Resume parsed successfully! Review the extracted data below.',
        });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error?.message || 'Failed to parse resume' });
      }
    } catch (error) {
      console.error('Error parsing resume:', error);
      setMessage({ type: 'error', text: 'Failed to parse resume' });
    } finally {
      setParsing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Please upload a PDF or DOCX file' });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 10MB' });
      return;
    }

    setSelectedFile(file);
    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch(`${API_URL}/api/profile/upload-resume`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfile({
          ...profile,
          resumeText: data.resumeText,
          structuredData: data.structuredData,
          desiredJobTitles: data.desiredJobTitles.join(', '),
        });
        setShowStructuredData(true);
        setMessage({
          type: 'success',
          text: `File "${data.fileName}" uploaded and parsed successfully!`,
        });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error?.message || 'Failed to upload file' });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage({ type: 'error', text: 'Failed to upload file' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    // Validate required fields
    if (!profile.fullName || !profile.email || !profile.resumeText) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile saved successfully!' });
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error?.message || 'Failed to save profile' });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              ← Back to Jobs
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Input Method Selection */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-3">Choose Input Method:</h3>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setInputMethod('resume')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition ${
                  inputMethod === 'resume'
                    ? 'border-blue-600 bg-blue-100 text-blue-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                }`}
              >
                <div className="font-medium">📄 Paste Resume (Quick)</div>
                <div className="text-xs mt-1">AI will extract your data automatically</div>
              </button>
              <button
                type="button"
                onClick={() => setInputMethod('manual')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition ${
                  inputMethod === 'manual'
                    ? 'border-blue-600 bg-blue-100 text-blue-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                }`}
              >
                <div className="font-medium">✍️ Enter Manually</div>
                <div className="text-xs mt-1">Fill in structured form fields</div>
              </button>
            </div>
          </div>

          {/* File Upload Section - At the Top */}
          {inputMethod === 'resume' && (
            <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    🤖 AI-Powered Resume Parser
                  </h3>
                  <p className="text-sm text-gray-600">
                    Upload your resume (PDF/DOCX) or paste text below, and AI will extract all your
                    information automatically
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* File Upload */}
                <div className="space-y-2">
                  <label className="block">
                    <div className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition">
                      <div className="text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-purple-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <p className="mt-2 text-sm font-medium text-gray-700">
                          {selectedFile ? selectedFile.name : 'Upload PDF or DOCX'}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Click to browse or drag and drop
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,.doc"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </div>
                  </label>
                  {uploading && (
                    <div className="flex items-center justify-center text-sm text-purple-600">
                      <span className="inline-block animate-spin mr-2">⚙️</span>
                      Uploading and parsing...
                    </div>
                  )}
                </div>

                {/* OR Divider */}
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-400">OR</div>
                    <div className="text-xs text-gray-500 mt-1">Choose one method</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Basic Information
              </h2>

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  required
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john.doe@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1234567890"
                  />
                </div>

                {/* Location */}
                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={profile.location || ''}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="San Francisco, CA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* GitHub URL */}
                <div>
                  <label
                    htmlFor="githubUrl"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    id="githubUrl"
                    value={profile.githubUrl || ''}
                    onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://github.com/username"
                  />
                </div>

                {/* LinkedIn URL */}
                <div>
                  <label
                    htmlFor="linkedinUrl"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    id="linkedinUrl"
                    value={profile.linkedinUrl || ''}
                    onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>
            </div>

            {/* Resume Section */}
            {inputMethod === 'resume' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Resume Text</h2>

                <div>
                  <label
                    htmlFor="resumeText"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Paste Your Resume <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="resumeText"
                    required
                    rows={12}
                    value={profile.resumeText}
                    onChange={(e) => setProfile({ ...profile, resumeText: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="Paste your resume text here, or upload a file above..."
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-500">
                      {profile.resumeText.length} / 50,000 characters
                    </p>
                    <button
                      type="button"
                      onClick={handleParseResume}
                      disabled={parsing || !profile.resumeText}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {parsing ? (
                        <>
                          <span className="inline-block animate-spin mr-2">⚙️</span>
                          Parsing...
                        </>
                      ) : (
                        '🤖 Parse Text with AI'
                      )}
                    </button>
                  </div>
                </div>

                {/* Show Parsed Data */}
                {showStructuredData && profile.structuredData && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-medium text-green-900 mb-2">✓ Extracted Data:</h3>
                    <div className="text-sm text-green-800 space-y-1">
                      <p>
                        • Work Experience: {profile.structuredData.workExperience?.length || 0}{' '}
                        positions
                      </p>
                      <p>• Skills: {profile.structuredData.skills?.length || 0} skills</p>
                      <p>• Education: {profile.structuredData.education?.length || 0} degrees</p>
                      {profile.structuredData.certifications &&
                        profile.structuredData.certifications.length > 0 && (
                          <p>• Certifications: {profile.structuredData.certifications.length}</p>
                        )}
                      {profile.desiredJobTitles && (
                        <p>• Suggested Job Titles: {profile.desiredJobTitles}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Manual Input - Simplified for now */}
            {inputMethod === 'manual' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Resume Details
                </h2>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    💡 Tip: For now, paste your resume and use the AI parser. Full manual entry
                    coming soon!
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="resumeTextManual"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Resume Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="resumeTextManual"
                    required
                    rows={10}
                    value={profile.resumeText}
                    onChange={(e) => setProfile({ ...profile, resumeText: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="Enter your resume text..."
                  />
                </div>
              </div>
            )}

            {/* Job Preferences */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Job Preferences</h2>

              <div>
                <label
                  htmlFor="desiredJobTitles"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Desired Job Titles
                </label>
                <input
                  type="text"
                  id="desiredJobTitles"
                  value={profile.desiredJobTitles || ''}
                  onChange={(e) => setProfile({ ...profile, desiredJobTitles: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Senior Developer, Lead Engineer, Tech Lead"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Comma-separated list of job titles you&apos;re interested in
                </p>
              </div>

              <div>
                <label
                  htmlFor="desiredLocations"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Desired Locations
                </label>
                <input
                  type="text"
                  id="desiredLocations"
                  value={profile.desiredLocations || ''}
                  onChange={(e) => setProfile({ ...profile, desiredLocations: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="San Francisco, Remote, New York"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Comma-separated list of preferred work locations
                </p>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Professional Summary
              </label>
              <textarea
                id="bio"
                rows={3}
                value={profile.bio || ''}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="A brief professional summary..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
              <Link
                href="/"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
