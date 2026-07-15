import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, Shield, Briefcase, FileText, ArrowRight, Check, Award, ArrowUpRight 
} from 'lucide-react';

const CHART_NODES_DATA = [
  { cx: 40, cy: 130, date: 'May 21, 2026', info: 'Tooling Setup: Skill score +10' },
  { cx: 136, cy: 90, date: 'Jun 14, 2026', info: 'React & JS Completed' },
  { cx: 232, cy: 105, date: 'Jul 23, 2026', info: 'UX Fundamentals Certificate' },
  { cx: 328, cy: 60, date: 'Aug 23, 2026', info: 'Node.js Backend Added' },
  { cx: 424, cy: 50, date: 'Sep 25, 2026', info: 'System Audit completed' },
  { cx: 520, cy: 25, date: 'Oct 12, 2026', info: 'AI Matching Score Reached 98%' }
];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hoveredNode, setHoveredNode] = useState(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const testimonialDelays = ['animate-delay-1', 'animate-delay-2', 'animate-delay-3'];
  const logoDelays = ['animate-delay-2', 'animate-delay-3', 'animate-delay-4', 'animate-delay-5', 'animate-delay-6'];
  const partnerLogos = [
    { name: 'Stripe', initials: 'S', bg: 'bg-sky-500', textColor: 'text-white', labelColor: 'text-slate-100' },
    { name: 'Figma', initials: 'F', bg: 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400', textColor: 'text-white', labelColor: 'text-slate-100' },
    { name: 'Google', initials: 'G', bg: 'bg-white', textColor: 'text-slate-950', labelColor: 'text-slate-100', border: 'border border-slate-200/10' },
    { name: 'Airbnb', initials: 'A', bg: 'bg-rose-500', textColor: 'text-white', labelColor: 'text-slate-100' },
    { name: 'State Univ', initials: 'U', bg: 'bg-slate-900/95', textColor: 'text-white', labelColor: 'text-slate-100' }
  ];

  const handleStartGrowth = () => {
    if (user) {
      if (user.role === 'student') navigate('/dashboard/student');
      else if (user.role === 'recruiter') navigate('/dashboard/recruiter');
      else if (user.role === 'admin') navigate('/admin');
    } else {
      navigate('/signup');
    }
  };

  const handleViewDemo = () => {
    // sign in as a demo student and redirect to the demo dashboard
    if (typeof window !== 'undefined' && window.__demo_view_trigger) {
      window.__demo_view_trigger('student');
    }
    navigate('/dashboard/student');
  };

  return (
    <div className="relative min-h-screen">
      {/* Background patterns */}
      <div className="absolute inset-0 grid-overlay opacity-80 pointer-events-none z-0"></div>
      
      {/* Background blobs */}
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blob-purple opacity-60 blur-3xl pointer-events-none"></div>
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blob-blue opacity-50 blur-3xl pointer-events-none"></div>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-24 text-center sm:px-6 lg:px-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
          <Sparkles className="h-3.5 w-3.5" />
          <span>NEW: AI-POWERED RESUME ANALYZER</span>
        </div>
        
        <h1 className="mb-6 font-display text-5xl font-black leading-none tracking-tight text-white sm:text-7xl">
          Your career, <span className="text-gradient-purple">in focus.</span>
        </h1>
        
        <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-gray-400 sm:text-xl">
          Transform your professional journey with precision-engineered AI tools for resume feedback, interview preparation, and hyper-personalized job matching.
        </p>
        
        <div className="mb-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button 
            onClick={handleStartGrowth}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500 sm:w-auto"
          >
            <span>Start Your Growth</span>
            <ArrowRight className="h-5 w-5" />
          </button>
          
          <button 
            onClick={handleViewDemo}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 sm:w-auto"
          >
            <span>View Demo</span>
          </button>
        </div>

        <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-3">
          {[
            { label: 'Resume Match Score', value: '98%' },
            { label: 'Active Opportunities', value: '1.2k+' },
            { label: 'Placement Success', value: '4.9/5' }
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4 text-left shadow-lg shadow-black/10 backdrop-blur-sm">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">{stat.label}</div>
              <div className="mt-1 text-xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section (replaces mock dashboard) */}
      <section id="testimonials" className="py-12 px-4 max-w-7xl mx-auto sm:px-6 lg:px-8 z-10 relative animate-fade-in">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">Trusted by Recruiters and Students</h2>
          <p className="text-gray-400 mb-8">Universities and hiring teams rely on CareerGenie to surface the best-fit candidates and help students showcase verified skills.</p>

          <div className="grid gap-6 sm:grid-cols-3 mb-10">
            <div className={`glass-panel-card p-6 rounded-2xl border border-white/5 animate-fade-up ${testimonialDelays[0]}`}>
              <p className="text-gray-300 italic">“CareerGenie's resume analyzer helped our students increase interview invites by 3x.”</p>
              <div className="mt-4 text-left">
                <div className="font-bold text-white">Prof. Maya Lopez</div>
                <div className="text-xs text-gray-400">Career Services, State University</div>
              </div>
            </div>

            <div className={`glass-panel-card p-6 rounded-2xl border border-white/5 animate-fade-up ${testimonialDelays[1]}`}>
              <p className="text-gray-300 italic">“We reduced screening time by 60% using AI match scores — great for campus hiring.”</p>
              <div className="mt-4 text-left">
                <div className="font-bold text-white">David Miller</div>
                <div className="text-xs text-gray-400">Senior Recruiter, Stripe</div>
              </div>
            </div>

            <div className={`glass-panel-card p-6 rounded-2xl border border-white/5 animate-fade-up ${testimonialDelays[2]}`}>
              <p className="text-gray-300 italic">“The skill-gap suggestions were actionable and improved my application success.”</p>
              <div className="mt-4 text-left">
                <div className="font-bold text-white">Olivia Chen</div>
                <div className="text-xs text-gray-400">Product Design Candidate</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 flex-wrap">
            {partnerLogos.map((logo, i) => (
              <div key={i} className={`flex flex-col items-center justify-center min-w-[126px] h-16 rounded-2xl shadow-lg shadow-black/20 animate-fade-up ${logoDelays[i]} ${logo.border || ''}`}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${logo.bg}`}>
                  <span className={`text-lg font-bold ${logo.textColor}`}>{logo.initials}</span>
                </div>
                <span className={`mt-2 text-[10px] font-semibold ${logo.labelColor}`}>{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stakeholders / Ecosystem Section */}
      <section id="features" className="py-20 px-4 max-w-7xl mx-auto sm:px-6 lg:px-8 text-center z-10 relative">
        <p className="text-xs uppercase tracking-wider text-indigo-400 font-bold mb-2">ECOSYSTEM</p>
        <h2 className="font-display font-bold text-3xl sm:text-5xl text-white mb-12">
          Tailored solutions for every stakeholder.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'For Students',
              desc: 'Unlock your potential with smart resume reviews, gap analysis reports, and direct connection to internship pipelines.',
              icon: <FileText className="w-5 h-5 text-indigo-400" />,
              bullets: ['Resume Parsing & Feedback', 'Automated Job Match Alignment', 'Visual Application Tracking']
            },
            {
              title: 'For Recruiters / Faculty',
              desc: 'Streamline campus and direct hiring. Post roles and instantly view matched candidates sorted by AI resume scoring.',
              icon: <Briefcase className="w-5 h-5 text-purple-400" />,
              bullets: ['Dynamic Job Postings UI', 'AI Match Insights per Candidate', 'Applicant Status Stepper Modals']
            },
            {
              title: 'For Admins',
              desc: 'Oversee placement rates, moderate job listings, verify roles, and examine site analytics logs in a secure panel.',
              icon: <Shield className="w-5 h-5 text-rose-400" />,
              bullets: ['Pending Job Approvals Panel', 'System Analytics Metrics', 'Full User Role Moderation']
            }
          ].map((item, index) => (
            <div key={index} className="glass-panel-card p-8 rounded-2xl border border-white/5 text-left flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-6">{item.desc}</p>
              </div>
              <ul className="flex flex-col gap-2.5 text-xs text-gray-300">
                {item.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Profile Showcase Section */}
      <section id="about" className="py-20 px-4 max-w-7xl mx-auto sm:px-6 lg:px-8 z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-left">
            <h2 className="font-display font-bold text-3xl sm:text-5xl text-white leading-tight mb-6">
              Resumes are dead.<br />Long live the Profile.
            </h2>
            <p className="text-gray-400 text-base leading-relaxed mb-8">
              Static PDF documents no longer capture the true potential of professional students. Our platform parses your resume to build a living profile model, highlighting technical trajectory and direct alignment with leading recruiters.
            </p>
            <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-slate-950/20 flex gap-4">
              <span className="text-3xl">💡</span>
              <p className="text-xs text-gray-300 leading-relaxed">
                <strong>Did you know?</strong> Profiles with verified skills matching score algorithms receive 3x higher response rates from Stripe, Airbnb, and other hiring panel companies than static PDFs.
              </p>
            </div>
          </div>
          
          {/* Visual Showcase (Restored PNGs with CSS float class animations) */}
          <div className="relative h-[360px] md:h-[450px] w-full flex items-center justify-center">
            {/* Candidate portrait */}
            <div className="absolute top-[10%] left-[5%] w-[60%] glass-panel p-2 rounded-2xl border border-white/10 shadow-2xl animate-float-slow bg-slate-900/60 z-20">
              <div className="rounded-xl overflow-hidden aspect-[4/3] bg-slate-950">
                <img 
                  src="/assets/candidate_a.png" 
                  alt="Candidate Olivia Chen" 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop";
                  }}
                />
              </div>
              <div className="text-[10px] text-center font-mono py-2 text-indigo-400 font-bold tracking-widest uppercase">CANDIDATE A</div>
            </div>

            {/* Network hub */}
            <div className="absolute bottom-[10%] right-[5%] w-[60%] glass-panel p-2 rounded-2xl border border-white/10 shadow-2xl animate-float-delayed bg-slate-900/60 z-10">
              <div className="rounded-xl overflow-hidden aspect-[4/3] bg-slate-950">
                <img 
                  src="/assets/network_hub.png" 
                  alt="Recruiting Network Office Hub" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&auto=format&fit=crop";
                  }}
                />
              </div>
              <div className="text-[10px] text-center font-mono py-2 text-purple-400 font-bold tracking-widest uppercase">NETWORK HUB</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 max-w-7xl mx-auto sm:px-6 lg:px-8 text-center z-10 relative">
        <p className="text-xs uppercase tracking-wider text-indigo-400 font-bold mb-2">PRICING PLANS</p>
        <h2 className="font-display font-bold text-3xl sm:text-5xl text-white mb-12">
          Invest in your career growth.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {[
            {
              name: 'Free Plan',
              price: '$0',
              desc: 'For individuals starting out',
              bullets: ['Basic AI Resume review (score-only)', '3 Job applications per month', 'Standard skills matching index'],
              featured: true
            },
            {
              name: 'Professional',
              price: '$19',
              desc: 'For serious job seekers',
              bullets: ['Unlimited AI resume parsing & suggestions', 'Unlimited job matching applications', 'Actionable skill gap training index', 'Mock interview sandbox & priority scoring'],
              featured: false
            },
            {
              name: 'Enterprise',
              price: 'Custom',
              desc: 'For universities and organizations',
              bullets: ['Everything in Pro plan', 'Admin Placement dashboard panel', 'University API integrations & exports', 'Dedicated accounts and metrics moderation'],
              featured: false
            }
          ].map((plan, i) => (
            <div 
              key={i} 
              className={`glass-panel-card p-8 rounded-2xl flex flex-col justify-between relative ${
                plan.featured ? 'border-indigo-500/50 shadow-2xl bg-indigo-950/20 scale-102 z-20' : 'border-white/5 z-10'
              }`}
            >
              {plan.featured && (
                <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                  MOST POPULAR
                </span>
              )}
              
              <div className="text-left">
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-xs text-gray-500 mb-6">{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-8 text-white">
                  <span className="text-4xl font-extrabold font-display">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="text-xs text-gray-500">/month</span>}
                </div>
                <ul className="flex flex-col gap-4 text-xs text-gray-300 mb-8">
                  {plan.bullets.map((bullet, j) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={plan.name === 'Professional' || plan.name === 'Enterprise' ? () => window.location.href = '/web' : handleStartGrowth}
                className={`w-full py-3 rounded-xl text-xs font-bold transition duration-300 ${
                  plan.featured 
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                }`}
              >
                {plan.name === 'Professional' || plan.name === 'Enterprise' ? 'Visit Web' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 max-w-7xl mx-auto sm:px-6 lg:px-8 z-10 relative">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 to-purple-900 border border-indigo-500/20 px-8 py-16 text-center shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.15),transparent_60%)]"></div>
          
          <h2 className="relative font-display font-black text-3xl sm:text-5xl text-white mb-4">
            Ready to focus your future?
          </h2>
          <p className="relative max-w-xl mx-auto text-gray-300 text-sm sm:text-base mb-8">
            Join 50,000+ placement students using CareerGenie to parse resumes and unlock matches at top-tier companies.
          </p>
          <button 
            onClick={handleStartGrowth}
            className="relative bg-white hover:bg-gray-100 text-slate-950 font-bold px-8 py-4 rounded-xl text-xs sm:text-sm tracking-wider uppercase transition shadow-xl"
          >
            Create Free Account
          </button>
        </div>
      </section>
    </div>
  );
}
