import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { JobsContext } from './JobsContextValue';

const INITIAL_JOBS = [
  {
    id: 'job_stripe_spd',
    title: 'Sr. Product Designer',
    company: 'Stripe',
    logo: 'S',
    logoBg: 'bg-indigo-600',
    location: 'Remote (US/Canada)',
    type: 'Full-time',
    skills: ['Figma', 'UX Design', 'React', 'HTML/CSS', 'JavaScript'],
    description: 'We are looking for a Senior Product Designer to join our team in building the future of online commerce. You will be responsible for creating intuitive, high-fidelity interfaces that simplify complex financial systems.',
    requirements: [
      '5+ years of experience designing complex web applications.',
      'Strong portfolio demonstrating high-fidelity interaction design and user research.',
      'Basic familiarity with frontend code (React, HTML/CSS) is highly desired.',
      'Excellent collaboration and storytelling skills.'
    ],
    salary: '$140k - $180k',
    deadline: 'Aug 15, 2026',
    status: 'active'
  },
  {
    id: 'job_google_swe',
    title: 'Software Engineering Intern',
    company: 'Google',
    logo: 'G',
    logoBg: 'bg-red-500',
    location: 'Mountain View, CA',
    type: 'Internship',
    skills: ['Python', 'C++', 'Algorithms', 'Data Structures', 'Git'],
    description: 'Join Google as a Software Engineering Intern and work on core systems, search infrastructure, or machine learning frameworks. You will work alongside Googlers on real-world systems.',
    requirements: [
      'Currently pursuing a BS, MS, or PhD in Computer Science or a related field.',
      'Solid programming experience in Python, Java, C++, or Go.',
      'Strong problem-solving, algorithms, and data structure fundamentals.',
      'Interest in working on large-scale distributed systems.'
    ],
    salary: '$45 - $60 / hr',
    deadline: 'Sep 30, 2026',
    status: 'active'
  },
  {
    id: 'job_figma_uxl',
    title: 'UX Lead',
    company: 'Figma',
    logo: 'F',
    logoBg: 'bg-black',
    location: 'San Francisco, CA',
    type: 'Full-time',
    skills: ['Figma', 'UX Design', 'User Research', 'Product Strategy'],
    description: 'As a UX Lead at Figma, you will shape the creative tools that power the design industry. You will direct user research, design critical workflows, and mentor other designers on the team.',
    requirements: [
      '8+ years of product design experience with 2+ years leading design teams.',
      'Expert level proficiency in Figma and prototyping tools.',
      'Proven track record of designing and launching developer or creator tools.',
      'Passion for designing tools that empower other creative professionals.'
    ],
    salary: '$180k - $220k',
    deadline: 'Aug 25, 2026',
    status: 'active'
  },
  {
    id: 'job_airbnb_spd',
    title: 'Sr. Product Designer (Trips)',
    company: 'Airbnb',
    logo: 'A',
    logoBg: 'bg-rose-500',
    location: 'Remote (US)',
    type: 'Full-time',
    skills: ['Figma', 'UX Design', 'Interaction Design', 'Framer'],
    description: 'We are seeking a senior designer to lead the design of the next-generation travel booking experience. You will map out end-to-end customer journeys and design pixel-perfect layouts for mobile and web.',
    requirements: [
      '6+ years of UX/UI design experience in consumer-facing mobile/web apps.',
      'Exceptional visual craft and layout skills.',
      'Expert prototyping capability (Figma, Framer, ProtoPie).',
      'Strong experience with user flow optimization and testing.'
    ],
    salary: '$150k - $190k',
    deadline: 'Aug 10, 2026',
    status: 'active'
  },
  {
    id: 'job_stripe_fse',
    title: 'Full Stack Engineer',
    company: 'Stripe',
    logo: 'S',
    logoBg: 'bg-indigo-600',
    location: 'Seattle, WA',
    type: 'Full-time',
    skills: ['React', 'Node.js', 'Express', 'JavaScript', 'PostgreSQL'],
    description: 'Develop features across our billing and subscription services. You will design database schemas, write secure Express APIs, and implement beautiful React dashboard interfaces.',
    requirements: [
      '3+ years of full-stack engineering experience.',
      'Proficiency in React and Node.js backend systems.',
      'Strong SQL database experience (PostgreSQL, MySQL).',
      'Understanding of JWT auth, session management, and API security.'
    ],
    salary: '$130k - $165k',
    deadline: 'Sep 15, 2026',
    status: 'active'
  },
  {
    id: 'job_netflix_nlp',
    title: 'AI/NLP Research Intern',
    company: 'Netflix',
    logo: 'N',
    logoBg: 'bg-red-600',
    location: 'Los Gatos, CA',
    type: 'Internship',
    skills: ['Python', 'NLP', 'Machine Learning', 'PyTorch'],
    description: 'Work with Netflix Recommendation Algorithms. Apply state-of-the-art NLP models (Transformers, LLMs) to personalize user search queries, content tagging, and translation automation.',
    requirements: [
      'MS or PhD student in Machine Learning, Computer Science, or Computational Linguistics.',
      'Hands-on experience with PyTorch, HuggingFace Transformers, or TensorFlow.',
      'Familiarity with text tokenization, keyword extraction, and vector databases.',
      'Publication record at ML/NLP conferences is a plus.'
    ],
    salary: '$65 - $80 / hr',
    deadline: 'Oct 05, 2026',
    status: 'active'
  }
];

export const JobsProvider = ({ children }) => {
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5178';

  const [jobs, setJobs] = useState(() => {
    const saved = localStorage.getItem('cg_jobs');
    return saved ? JSON.parse(saved) : INITIAL_JOBS;
  });

  // Fetch jobs from mock API and replace local list if available
  const fetchJobs = async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/api/jobs`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      const data = await res.json();
      if (res.ok && data.jobs && Array.isArray(data.jobs)) {
        // map remote shape to local job shape with reasonable defaults
        const mapped = data.jobs.map(j => ({
          id: j.id,
          title: j.title,
          company: j.company,
          logo: (j.company && j.company[0]) || 'J',
          logoBg: j.logoBg || 'bg-indigo-600',
          location: j.location || 'Remote',
          type: j.type || (j.tags && j.tags.includes('Intern') ? 'Internship' : 'Full-time'),
          skills: j.tags || j.skills || [],
          description: j.description || j.summary || '',
          requirements: j.requirements || [],
          salary: j.salary || 'Competitive',
          deadline: j.deadline || 'TBD',
          status: j.status || 'active'
        }));
        setJobs(mapped);
      }
    } catch {
      // network error - keep local jobs
    }
  };

  const { getAuthToken } = useAuth();

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem('cg_jobs', JSON.stringify(jobs));
  }, [jobs]);

  const addJob = (jobData) => {
    const newJob = {
      id: `job_${Math.random().toString(36).substr(2, 9)}`,
      ...jobData,
      logoBg: jobData.logoBg || 'bg-slate-600',
      status: jobData.status || 'pending_approval' // Recruiter posts require admin moderation
    };
    setJobs(prev => [newJob, ...prev]);
    return newJob;
  };

  const approveJob = (jobId) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: 'active' } : job
    ));
  };

  const rejectJob = (jobId) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: 'rejected' } : job
    ));
  };

  const getJobById = (jobId) => {
    return jobs.find(job => job.id === jobId);
  };

  const calculateMatchScore = (jobSkills, userSkills = []) => {
    if (!jobSkills || jobSkills.length === 0) return 0;
    if (!userSkills || userSkills.length === 0) return 30; // base score if they have some general profile

    const jobSkillsLower = jobSkills.map(s => s.toLowerCase());
    const userSkillsLower = userSkills.map(s => s.toLowerCase());
    
    let matchCount = 0;
    jobSkillsLower.forEach(js => {
      if (userSkillsLower.some(us => us.includes(js) || js.includes(us))) {
        matchCount++;
      }
    });

    const percent = Math.round((matchCount / jobSkills.length) * 100);
    // Return at least 40% if they have some general matching, max 100%
    return Math.max(percent, 35);
  };

  return (
    <JobsContext.Provider value={{ jobs, addJob, approveJob, rejectJob, getJobById, calculateMatchScore, fetchJobs }}>
      {children}
    </JobsContext.Provider>
  );
};

