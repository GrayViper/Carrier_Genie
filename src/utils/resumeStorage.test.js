import { beforeEach, describe, expect, it } from 'vitest';
import { clearStoredResume, getStoredResume, hasStoredResume, saveStoredResume } from './resumeStorage';

describe('resumeStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists a student resume blob so it can be downloaded later', () => {
    const resume = {
      fileName: 'olivia.pdf',
      contentBase64: 'dGVzdA==',
      mimeType: 'application/pdf',
      size: 1234,
      uploadedAt: '2026-07-15T00:00:00.000Z'
    };

    saveStoredResume('student_1', resume);

    expect(hasStoredResume('student_1')).toBe(true);
    expect(getStoredResume('student_1').fileName).toBe('olivia.pdf');
    clearStoredResume('student_1');
    expect(hasStoredResume('student_1')).toBe(false);
  });
});
