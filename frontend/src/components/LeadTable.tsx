import React from "react";

export interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  company: string;
  job_title: string;
  email: string;
  phone?: string;
  status: string; // New, Qualified, Disqualified
  score?: number;
  qualification_reason?: string;
  generated_email?: string;
}

interface LeadTableProps {
  leads: Lead[];
  selectedLeadId: number | null;
  onSelectLead: (lead: Lead) => void;
  onQualifyLead: (leadId: number) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: number) => void;
  qualifyingLeads: Record<number, boolean>;
}

export default function LeadTable({
  leads,
  selectedLeadId,
  onSelectLead,
  onQualifyLead,
  onEditLead,
  onDeleteLead,
  qualifyingLeads
}: LeadTableProps) {
  
  const getScoreBadge = (score?: number) => {
    if (score === undefined || score === null) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700/50">
          N/A
        </span>
      );
    }
    if (score > 70) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {score} - Highly Qualified
        </span>
      );
    }
    if (score >= 30) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          {score} - Good Match
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
        {score} - Disqualified
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Qualified":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/25">
            Qualified
          </span>
        );
      case "Disqualified":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/25">
            Disqualified
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/25">
            New
          </span>
        );
    }
  };

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl backdrop-blur-xl">
        <svg className="w-12 h-12 text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-slate-400 font-medium">No leads in the pipeline yet.</p>
        <p className="text-sm text-slate-500 mt-1">Add a new lead manually to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-slate-900/30 border border-slate-800/80 rounded-2xl backdrop-blur-xl shadow-2xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/50">
            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Name</th>
            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Company</th>
            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Job Title</th>
            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">AI Score</th>
            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {leads.map((lead) => {
            const isSelected = selectedLeadId === lead.id;
            const isQualifying = qualifyingLeads[lead.id] || false;
            
            return (
              <tr 
                key={lead.id}
                onClick={() => onSelectLead(lead)}
                className={`group cursor-pointer transition-all duration-200 hover:bg-slate-800/30 ${
                  isSelected ? "bg-slate-800/40 border-l-2 border-indigo-500" : "border-l-2 border-transparent"
                }`}
              >
                <td className="p-4">
                  <div className="font-semibold text-slate-200">
                    {lead.first_name} {lead.last_name}
                  </div>
                  <div className="text-xs text-slate-400">{lead.email}</div>
                  {lead.phone && <div className="text-[10px] text-slate-500 mt-0.5">{lead.phone}</div>}
                </td>
                <td className="p-4 text-slate-300 font-medium">{lead.company}</td>
                <td className="p-4 text-slate-400">{lead.job_title}</td>
                <td className="p-4">{getScoreBadge(lead.score)}</td>
                <td className="p-4">{getStatusBadge(lead.status)}</td>
                <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end space-x-2">
                    {/* Run AI Analysis Button */}
                    <button
                      onClick={() => onQualifyLead(lead.id)}
                      disabled={isQualifying}
                      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        isQualifying
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                          : "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white"
                      }`}
                    >
                      {isQualifying ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Scoring...
                        </>
                      ) : (
                        "Run AI Analysis"
                      )}
                    </button>

                    {/* Edit Lead Button */}
                    <button
                      onClick={() => onEditLead(lead)}
                      title="Edit Lead"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Delete Lead Button */}
                    <button
                      onClick={() => onDeleteLead(lead.id)}
                      title="Delete Lead"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
