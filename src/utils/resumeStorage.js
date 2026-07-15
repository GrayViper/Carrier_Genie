const STORAGE_KEY_PREFIX = 'cg_resume_';

export const getStoredResumeKey = (studentId) => `${STORAGE_KEY_PREFIX}${studentId || 'anonymous'}`;

export const saveStoredResume = (studentId, resume) => {
  if (!studentId || !resume) return null;
  const payload = {
    ...resume,
    uploadedAt: resume.uploadedAt || new Date().toISOString()
  };
  localStorage.setItem(getStoredResumeKey(studentId), JSON.stringify(payload));
  return payload;
};

export const getStoredResume = (studentId) => {
  if (!studentId) return null;
  const saved = localStorage.getItem(getStoredResumeKey(studentId));
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
};

export const hasStoredResume = (studentId) => Boolean(getStoredResume(studentId));

export const clearStoredResume = (studentId) => {
  if (!studentId) return;
  localStorage.removeItem(getStoredResumeKey(studentId));
};

export const normalizeResumeProfile = (user) => {
  if (!user || user.role !== 'student') return user;
  const storedResume = getStoredResume(user.id);
  return {
    ...user,
    resumeUploaded: Boolean(storedResume || user.resumeUploaded)
  };
};
