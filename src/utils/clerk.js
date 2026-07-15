export const normalizeClerkUser = (clerkUser, fallbackRole = 'student') => {
  const primaryEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || '';
  const role = clerkUser?.publicMetadata?.role || fallbackRole;
  const fullName = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ').trim();

  return {
    id: clerkUser?.id || `clerk_${Math.random().toString(36).slice(2, 9)}`,
    name: fullName || primaryEmail || 'Clerk User',
    email: primaryEmail,
    role,
    skills: role === 'student' ? ['JavaScript', 'React'] : [],
    resumeUploaded: false
  };
};

export const clearClerkSessionStorage = () => {
  localStorage.removeItem('cg_user');
  localStorage.removeItem('cg_token');
  localStorage.removeItem('clerk_session');
};
