import React, { useState } from "react";
import { Lead } from "./LeadTable";

interface EmailViewerProps {
  lead: Lead | null;
  onShowToast?: (message: string, type: "success" | "error" | "info") => void;
}

export default function EmailViewer({ lead, onShowToast }: EmailViewerProps) {
  const [copied, setCopied] = useState(false);

  if (!lead) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900/20 border border-slate-800/80 rounded-2xl backdrop-blur-xl">
        <svg className="w-10 h-10 text-slate-600 mb-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-sm font-semibold text-slate-400">No Lead Selected</p>
        <p className="text-xs text-slate-500 mt-1 max-w-[240px]">Select a lead row from the pipeline to preview their generated outreach sequence.</p>
      </div>
    );
  }

  const handleCopy = async () => {
    if (!lead.generated_email) return;
    try {
      await navigator.clipboard.writeText(lead.generated_email);
      setCopied(true);
      if (onShowToast) {
        onShowToast("Outbound email copied to clipboard!", "success");
      }
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      if (onShowToast) {
        onShowToast("Failed to copy text to clipboard.", "error");
      }
    }
  };


  return (
    <div className="flex flex-col h-full bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-200 text-sm">Outreach Workspace</h3>
          <p className="text-xs text-indigo-400 mt-0.5 font-medium">{lead.first_name} {lead.last_name} @ {lead.company}</p>
        </div>
        {lead.generated_email && (
          <button
            onClick={handleCopy}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              copied 
                ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50"
            }`}
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span>Copy Email</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-5">
        
        {/* Score & Evaluation Panel */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Evaluation Summary</span>
            {lead.score !== undefined && lead.score !== null ? (
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                lead.score >= 70 ? "text-emerald-400 bg-emerald-500/10" : 
                lead.score >= 30 ? "text-amber-400 bg-amber-500/10" : "text-rose-400 bg-rose-500/10"
              }`}>
                Score: {lead.score}/100
              </span>
            ) : (
              <span className="text-xs text-slate-500 font-medium">Unscored</span>
            )}
          </div>
          
          {lead.qualification_reason ? (
            <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/40">
              &ldquo;{lead.qualification_reason}&rdquo;
            </p>
          ) : (
            <p className="text-xs text-slate-500 leading-relaxed italic">
              No evaluation reason generated. Click &ldquo;Run AI Analysis&rdquo; to qualify lead details and draft outbound content.
            </p>
          )}
        </div>

        {/* Generated Email Content */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Generated Cold Outreach</span>
          {lead.status === "Disqualified" ? (
            <div className="p-6 text-center border border-rose-500/10 bg-rose-500/5 rounded-xl">
              <svg className="w-8 h-8 text-rose-500/50 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <p className="text-xs font-semibold text-rose-400">Lead Disqualified</p>
              <p className="text-[11px] text-slate-500 mt-1">This lead has an AI score below 30. Outreach generation was skipped to preserve campaign safety.</p>
            </div>
          ) : lead.generated_email ? (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-text h-[320px] overflow-y-auto">
              {lead.generated_email}
            </div>
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-800 rounded-xl">
              <svg className="w-8 h-8 text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 19v-8.93a2 2 0 01.89-1.664l8-4.997a2 2 0 012.22 0l8 4.997A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
              </svg>
              <p className="text-xs font-semibold text-slate-500">Outreach Email Pending</p>
              <p className="text-[10px] text-slate-600 mt-1 max-w-[200px]">Run the AI qualification analysis for this lead to generate outbound copy.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
