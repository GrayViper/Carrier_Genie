import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { 
  Upload, FileText, CheckCircle, Loader2, ArrowRight, Download, 
  Sparkles, ListChecks, Check, ShieldAlert 
} from 'lucide-react';
import { calculateAtsScore, generateAtsSuggestions } from '../utils/resume';
import { saveStoredResume } from '../utils/resumeStorage';
import { analyzeResume } from '../utils/geminiAnalysis';

export default function ResumeUpload() {
  const { user, updateUserProfile, saveProfile, getAuthToken } = useAuth();
  const navigate = useNavigate();
  
  const [file, setFile] = useState(null);
  const [fileBase64, setFileBase64] = useState(null);
  const fileBase64Ref = React.useRef(null); // ref so runBackendAnalysis always gets latest value
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
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setReport(null);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result || '';
        const base64 = result.split(',')[1] || '';
        setFileBase64(base64);
        fileBase64Ref.current = base64; // keep ref in sync for immediate use
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

    // If FileReader hasn't finished yet, wait up to 2s for it
    if (!fileBase64Ref.current) {
      const waitForBase64 = (attempts = 0) => {
        if (fileBase64Ref.current) {
          startAnalysis();
        } else if (attempts < 10) {
          setTimeout(() => waitForBase64(attempts + 1), 200);
        }
      };
      waitForBase64();
      return;
    }

    startAnalysis();
  };

  const startAnalysis = () => {
    setParsing(true);
    setParsingStep(0);

    // Step through visual parsing stages
    let step = 0;
    const advance = () => {
      step += 1;
      if (step < steps.length) {
        setParsingStep(step);
        setTimeout(advance, 800);
      }
    };
    setTimeout(advance, 800);

    // Run Gemini analysis directly from the browser
    const base64 = fileBase64Ref.current;
    analyzeResume(base64, file.name)
      .then(result => finishParsing(result, base64))
      .catch(() => finishParsing({
        score: 76, atsScore: 72,
        skills: [],
        strengths: ['Resume uploaded successfully.'],
        weaknesses: ['Could not complete AI analysis.'],
        suggestions: ['Try again or check your connection.'],
        analysisType: 'fallback'
      }, base64));
  };

  const finishParsing = (analysisResult, base64) => {
    if (!user) return;

    const feedback = {
      score: analysisResult.score,
      strengths: analysisResult.strengths,
      weaknesses: analysisResult.weaknesses,
      suggestions: analysisResult.suggestions
    };

    // Merge AI-detected skills with the student's existing skills (de-duplicated, normalized)
    const existingSkills = Array.isArray(user.skills) ? user.skills : [];
    const aiSkills = Array.isArray(analysisResult.skills) ? analysisResult.skills : [];
    const mergedSkills = Array.from(
      new Set(
        [...existingSkills, ...aiSkills].map(s => s.trim()).filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1))
      )
    );

    const storedResume = saveStoredResume(user?.id, {
      fileName: file.name,
      contentBase64: base64 || fileBase64Ref.current || '',
      mimeType: file.type || 'application/pdf',
      size: file.size,
      uploadedAt: new Date().toISOString()
    });

    const newProfile = {
      resumeUploaded: Boolean(storedResume),
      resumeName: file.name,
      resumeScore: analysisResult.score,
      skills: mergedSkills.length ? mergedSkills : existingSkills,
      feedback
    };

    try {
      const calc = calculateAtsScore(newProfile.skills, analysisResult.score);
      const sug = generateAtsSuggestions(newProfile.skills, feedback, calc);
      setAtsScore(analysisResult.atsScore || calc);
      setAtsSuggestions(sug);
      newProfile.atsScore = analysisResult.atsScore || calc;
    } catch {
      setAtsScore(analysisResult.atsScore || 72);
    }

    // Set report and score BEFORE clearing parsing state to avoid blank flash
    setReport(feedback);
    setReportScore(analysisResult.score);
    
    // Update local state immediately
    updateUserProfile(newProfile);
    
    // Sync with the backend database
    saveProfile(user.id, newProfile)
      .then(() => {
        console.log('Profile saved to database successfully');
      })
      .catch(err => console.error('Failed to sync profile with database:', err));

    // Upload base64 resume content to the server
    getAuthToken().then(token => {
      fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:5178'}/api/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          studentId: user.id,
          fileName: file.name,
          contentBase64: base64 || fileBase64Ref.current || ''
        })
      })
      .then(res => {
        if (!res.ok) console.error('Resume upload returned status:', res.status);
      })
      .catch(err => console.error('Error uploading resume to backend:', err));
    });

    setParsing(false);
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
                  className={`absolute inset-0 opacity-0 ${parsing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  disabled={parsing}
                />
                <Upload className="w-10 h-10 text-gray-500 mb-3" />
                <span className="text-white font-semibold block mb-1">
                  {file ? file.name : 'Select PDF Resume'}
                </span>
                <span className="text-gray-500 text-[10px]">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF only, max size 5MB'}
                </span>
              </div>



              <button
                type="submit"
                disabled={!file || parsing}
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
              {parsingStep >= steps.length - 1 && (
                <div className="flex items-center gap-1.5 text-amber-300 animate-fade-in pt-1 border-t border-white/5 mt-1">
                  <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                  <span>Waiting for Gemini AI analysis...</span>
                </div>
              )}
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
