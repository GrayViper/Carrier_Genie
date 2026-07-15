import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { 
  Upload, FileText, CheckCircle, Loader2, ArrowRight, Download, 
  Sparkles, ListChecks, Check, ShieldAlert 
} from 'lucide-react';
import { calculateAtsScore, generateAtsSuggestions } from '../utils/resume';
import { saveStoredResume } from '../utils/resumeStorage';

export default function ResumeUpload() {
  const { user, updateUserProfile, getAuthToken } = useAuth();
  const navigate = useNavigate();
  
  const [file, setFile] = useState(null);
  const [fileBase64, setFileBase64] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [atsScore, setAtsScore] = useState(user?.atsScore || 0);
  const [atsSuggestions, setAtsSuggestions] = useState([]);
  const [parsingStep, setParsingStep] = useState(0);
  const [report, setReport] = useState(user?.resumeUploaded ? user.feedback : null);
  const [reportScore, setReportScore] = useState(user?.resumeUploaded ? user.resumeScore : 0);

  const steps = [
    'Reading PDF layout structures...',
    'Tokenizing text blocks & filtering headers...',
    'Running AI NLP keyword matching algorithms...',
    'Analyzing skill gaps & experience density...',
    'Finalizing suggestions report...'
  ];

  const handleFileChange = (e) => {
    // prevent file selection if profile is incomplete
    if (!isProfileComplete()) return;
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setReport(null); // Clear previous reports
      // read file as base64 for upload
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result || '';
        // result is data:[mime];base64,xxxxx - strip prefix
        const base64 = result.split(',')[1] || '';
        setFileBase64(base64);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const isProfileComplete = () => {
    if (!user) return false;
    const hasMajor = !!(user.major && String(user.major).trim());
    const hasGrad = !!(user.graduationYear && Number(user.graduationYear) > 1900);
    const hasSkills = Array.isArray(user.skills) && user.skills.length > 0;
    return hasMajor && hasGrad && hasSkills;
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!file) return;

    setParsing(true);
    setParsingStep(0);

    // Simulate scanning/parsing steps
    const interval = setInterval(() => {
      setParsingStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          finishParsing();
          return prev;
        }
      });
    }, 800);
  };

  const finishParsing = () => {
    setParsing(false);
    
    // Mock parsing results and skills to append
    const parsedSkills = ['React', 'JavaScript', 'HTML/CSS', 'UX Design', 'Figma', 'Python', 'Tailwind CSS', 'Git'];
    const feedback = {
      score: 88,
      strengths: [
        'Strong showcase of modern frontend technologies (React, JavaScript).',
        'Figma and user experience layout elements are highlighted exceptionally.',
        'Well-formatted file naming convention and structured design layout.'
      ],
      weaknesses: [
        'Lacks cloud container knowledge (Docker/Kubernetes).',
        'SQL database structures and relationships could be further detailed.',
        'Minimal automated unit testing references (Jest).'
      ],
      suggestions: [
        'Incorporate a Docker setup container in one of your portfolio projects.',
        'Detail queries and databases used in your full-stack projects.',
        'Include a testing section mentioning experience with testing libraries.'
      ]
    };

    setReport(feedback);
    setReportScore(feedback.score);

    const storedResume = saveStoredResume(user?.id, {
      fileName: file.name,
      contentBase64: fileBase64,
      mimeType: file.type || 'application/pdf',
      size: file.size,
      uploadedAt: new Date().toISOString()
    });

    // Save in user profile context and attempt to persist to mock API
    const newProfile = {
      resumeUploaded: Boolean(storedResume),
      resumeName: file.name,
      resumeScore: feedback.score,
      skills: parsedSkills,
      feedback: feedback
    };

    // calculate ATS score and suggestions
    try {
      const calc = calculateAtsScore(parsedSkills, feedback.score);
      const sug = generateAtsSuggestions(parsedSkills, feedback, calc);
      setAtsScore(calc);
      setAtsSuggestions(sug);
      newProfile.atsScore = calc;
      newProfile.atsSuggestions = sug;
    } catch {
      // ignore
    }

    // optimistic update
    updateUserProfile(newProfile);

    // send to mock API if available
    (async () => {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5178';
      try {
        const token = await getAuthToken();
        const res = await fetch(`${API_BASE}/api/resume`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ studentId: user?.id, fileName: file.name, contentBase64: fileBase64 })
        });
        if (res.ok) {
          const data = await res.json();
          // Only update profile if the server returns a valid user object with role intact
          if (data.user && data.user.id && data.user.role) {
            updateUserProfile(data.user);
            if (data.user.atsScore) setAtsScore(data.user.atsScore);
            if (data.user.atsSuggestions) setAtsSuggestions(data.user.atsSuggestions || []);
          }
        }
      } catch {
        // ignore network errors — optimistic update already applied
      }
    })();
  };

  const handleDownloadReport = () => {
    // Simulated report document download
    const element = document.createElement("a");
    const fileContent = `CAREERGENIE AI RESUME REPORT\n========================\nFile: ${user?.resumeName || 'Resume.pdf'}\nOverall Rating: ${reportScore}/100\n\nSTRENGTHS:\n- ${report?.strengths.join('\n- ')}\n\nWEAKNESSES:\n- ${report?.weaknesses.join('\n- ')}\n\nSUGGESTIONS:\n- ${report?.suggestions.join('\n- ')}`;
    const fileData = new Blob([fileContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(fileData);
    element.download = "CareerGenie_AI_Feedback_Report.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="py-10 px-4 max-w-5xl mx-auto sm:px-6 lg:px-8 text-left space-y-8">
      {/* Title */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-display font-black text-white">AI Resume Analysis</h1>
        <p className="text-sm text-gray-400">Upload your PDF resume to receive direct NLP feedback, keyword adjustments, and compatibility enhancements.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        
        {/* Upload Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel-card p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="font-display font-bold text-lg text-white">Upload Resume</h3>
            
            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center transition relative bg-slate-900/10">
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={handleFileChange}
                  className={`absolute inset-0 opacity-0 ${!isProfileComplete() || parsing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  disabled={!isProfileComplete() || parsing}
                />
                <Upload className="w-10 h-10 text-gray-500 mb-3" />
                <span className="text-white font-semibold block mb-1">
                  {file ? file.name : 'Select PDF Resume'}
                </span>
                <span className="text-gray-500 text-[10px]">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF only, max size 5MB'}
                </span>
              </div>

              {!isProfileComplete() && (
                <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-200">
                  <div className="mb-1 font-semibold">Complete your profile to upload a resume</div>
                  <div className="text-xs text-amber-100/80 mb-3">Please add your major, expected graduation year, and at least one skill in your profile.</div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => navigate('/dashboard/student')} className="rounded-full bg-amber-400/70 px-3 py-1 text-sm font-semibold text-slate-900">Complete profile</button>
                    <button type="button" onClick={() => { updateUserProfile({}); }} className="rounded-full border border-amber-400/20 px-3 py-1 text-sm text-amber-100">Remind me later</button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!file || parsing || !isProfileComplete()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-gray-600 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {parsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Resume...</span>
                  </>
                ) : (
                  <>
                    <span>Submit & Analyze</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Simulated scanning steps console */}
          {parsing && (
            <div className="glass-panel p-5 rounded-2xl border border-indigo-500/20 bg-slate-950 font-mono text-[10px] space-y-2 text-indigo-400">
              <div className="flex items-center justify-between text-[11px] font-bold border-b border-indigo-500/15 pb-2 mb-2">
                <span>AI NLP Parser logs</span>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
              {steps.slice(0, parsingStep + 1).map((step, i) => (
                <div key={i} className="flex items-center gap-1.5 animate-fade-in text-indigo-300">
                  <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feedback Report Area */}
        <div className="lg:col-span-3">
          {report ? (
            <div className="glass-panel-card p-6 rounded-2xl border border-white/5 space-y-6">
              
              {/* Header metrics */}
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-white">AI Feedback Report</h3>
                    <p className="text-[10px] text-gray-500">Updated matches score instantly calculated.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-2xl font-black text-white block">{reportScore} / 100</span>
                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">NLP Score</span>
                  </div>
                  <button
                    onClick={handleDownloadReport}
                    className="p-2 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white rounded-lg transition"
                    title="Download Report"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ATS Score Panel */}
              <div className="flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-indigo-400 font-bold text-lg">ATS</div>
                  <div>
                    <div className="text-sm font-bold text-white">ATS Readiness</div>
                    <div className="text-[12px] text-gray-400">Estimated parsing score for applicant tracking systems</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-extrabold text-white">{atsScore}%</div>
                  <div className="text-[10px] text-gray-400">Higher is better for automated screening</div>
                </div>
              </div>

              {/* Strengths */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>Strengths Detected</span>
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-gray-300">
                  {report.strengths.map((str, i) => <li key={i}>{str}</li>)}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Missing Keywords & Weaknesses</span>
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-gray-300">
                  {report.weaknesses.map((weak, i) => <li key={i}>{weak}</li>)}
                </ul>
              </div>

              {/* Improvement Suggestions */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-indigo-400 flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4" />
                  <span>Actionable Suggestions</span>
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-gray-300 bg-slate-900/30 p-4 rounded-xl border border-white/5">
                  {report.suggestions.map((sug, i) => <li key={i}>{sug}</li>)}
                </ul>
              </div>

              {/* ATS-specific Suggestions */}
              <div className="space-y-2 text-xs pt-2">
                <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>ATS Improvement Suggestions</span>
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-gray-300 bg-slate-900/20 p-4 rounded-lg border border-white/5">
                  {(atsSuggestions && atsSuggestions.length > 0) ? (
                    atsSuggestions.map((s, i) => <li key={i}>{s}</li>)
                  ) : (
                    <li>No additional ATS tips — your resume parses well.</li>
                  )}
                </ul>
              </div>

            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-white/5 text-center flex flex-col justify-center items-center h-full min-h-[300px] text-gray-500">
              <FileText className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-sm font-semibold mb-1 text-gray-400">Waiting for Resume Upload</p>
              <p className="text-xs max-w-xs leading-relaxed">
                Submit your CV to see strengths, core gaps, and suggestions generated by NLP parsing models.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
