"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import LeadTable, { Lead } from "@/components/LeadTable";
import LeadModal from "@/components/LeadModal";
import EmailViewer from "@/components/EmailViewer";

export default function DashboardPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [qualifyingLeads, setQualifyingLeads] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  
  // Custom interactive UX states
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Authenticate user check on client side mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      fetchLeads();
    }
  }, [router]);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    // Reset toast state after 4 seconds
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 4000);
  };

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await apiRequest<Lead[]>("/leads", "GET");
    if (fetchError) {
      setError(fetchError);
      showToast(`Failed to load leads: ${fetchError}`, "error");
    } else if (data) {
      setLeads(data);
      // Auto select the first lead if no lead is currently selected
      if (data.length > 0) {
        setSelectedLead(data[0]);
      }
    }
    setLoading(false);
  };

  const handleOpenAddModal = () => {
    setEditingLead(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
  };

  const handleSaveLead = async (leadData: {
    first_name: string;
    last_name: string;
    company: string;
    job_title: string;
    email: string;
    phone?: string;
  }) => {
    setSubmittingLead(true);
    
    if (editingLead) {
      // Update Lead via PUT
      const { data, error: updateError } = await apiRequest<Lead>(`/leads/${editingLead.id}`, "PUT", leadData);
      setSubmittingLead(false);
      
      if (updateError) {
        showToast(`Failed to update lead: ${updateError}`, "error");
        throw new Error(updateError);
      }
      
      if (data) {
        setLeads((prev) => prev.map((l) => (l.id === editingLead.id ? data : l)));
        if (selectedLead && selectedLead.id === editingLead.id) {
          setSelectedLead(data);
        }
        showToast(`Lead profile for ${data.first_name} ${data.last_name} updated successfully.`, "success");
      }
    } else {
      // Create Lead via POST
      const { data, error: createError } = await apiRequest<Lead>("/leads", "POST", leadData);
      setSubmittingLead(false);
      
      if (createError) {
        showToast(`Failed to create lead: ${createError}`, "error");
        throw new Error(createError);
      }
      
      if (data) {
        setLeads((prev) => [data, ...prev]);
        setSelectedLead(data);
        showToast(`New lead profile for ${data.first_name} ${data.last_name} added.`, "success");
      }
    }
  };

  const handleDeleteLeadClick = (leadId: number) => {
    const target = leads.find((l) => l.id === leadId);
    if (target) {
      setLeadToDelete(target);
    }
  };

  const confirmDeleteLead = async () => {
    if (!leadToDelete) return;
    const leadId = leadToDelete.id;
    const { error: deleteError } = await apiRequest(`/leads/${leadId}`, "DELETE");
    if (deleteError) {
      showToast(`Failed to delete lead: ${deleteError}`, "error");
      setLeadToDelete(null);
      return;
    }
    
    // Filter out from UI list
    const updatedLeads = leads.filter((l) => l.id !== leadId);
    setLeads(updatedLeads);
    
    // Re-adjust selected lead if deleted
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(updatedLeads.length > 0 ? updatedLeads[0] : null);
    }
    
    showToast(`Lead "${leadToDelete.first_name} ${leadToDelete.last_name}" has been deleted.`, "success");
    setLeadToDelete(null);
  };

  const handleQualifyLead = async (leadId: number) => {
    // Set this lead as qualifying (loading state)
    setQualifyingLeads((prev) => ({ ...prev, [leadId]: true }));
    
    const { data, error: qualifyError } = await apiRequest<Lead>(`/leads/${leadId}/qualify`, "POST");
    
    // Clear qualifying state
    setQualifyingLeads((prev) => ({ ...prev, [leadId]: false }));

    if (qualifyError) {
      showToast(`AI qualification failed: ${qualifyError}`, "error");
      return;
    }

    if (data) {
      // Update leads list state
      setLeads((prev) => prev.map((l) => (l.id === leadId ? data : l)));
      
      // If the qualified lead is currently active in the viewer, sync details
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(data);
      }

      if (data.status === "Qualified") {
        showToast(`Lead qualified successfully! Score: ${data.score}/100.`, "success");
      } else {
        showToast(`Lead qualified! Disqualified due to low score (${data.score}/100).`, "info");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  // Metrics
  const totalLeads = leads.length;
  const highlyQualified = leads.filter((l) => l.score !== undefined && l.score !== null && l.score > 70).length;
  const emailsGenerated = leads.filter((l) => l.generated_email !== undefined && l.generated_email !== null).length;


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-100">Mini AI SDR</span>
              <span className="ml-2 px-2 py-0.5 text-[9px] font-semibold bg-indigo-600/20 text-indigo-400 border border-indigo-500/35 rounded-full uppercase tracking-wider">Agent Engine</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/10"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Lead
            </button>
            
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        
        {/* Metrics Grid Header */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl flex items-center space-x-5">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/15 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Leads In Pipeline</p>
              <h2 className="text-3xl font-extrabold text-slate-100 mt-1">{loading ? "-" : totalLeads}</h2>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl flex items-center space-x-5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Highly Qualified Leads</p>
              <h2 className="text-3xl font-extrabold text-slate-100 mt-1">{loading ? "-" : highlyQualified}</h2>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl flex items-center space-x-5">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Outreach Emails Written</p>
              <h2 className="text-3xl font-extrabold text-slate-100 mt-1">{loading ? "-" : emailsGenerated}</h2>
            </div>
          </div>
        </section>

        {/* Dashboard grid mapping list and viewer */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Leads table wrapper */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-bold text-slate-200">SDR Campaign Pipeline</h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage and qualify profiles using multi-agent workflows.</p>
              </div>
              
              {leads.length > 0 && (
                <button
                  onClick={fetchLeads}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Refresh leads"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3m0 0l3 3m-3-3v8" />
                  </svg>
                </button>
              )}
            </div>

            {error && (
              <div className="p-4 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                Error Loading Pipeline: {error}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center p-24 text-center bg-slate-900/15 border border-slate-800/60 rounded-2xl">
                <svg className="animate-spin h-8 w-8 text-indigo-500 mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-sm text-slate-400">Loading sales lead pipeline...</p>
              </div>
            ) : (
              <LeadTable
                leads={leads}
                selectedLeadId={selectedLead ? selectedLead.id : null}
                onSelectLead={setSelectedLead}
                onQualifyLead={handleQualifyLead}
                onEditLead={handleOpenEditModal}
                onDeleteLead={handleDeleteLeadClick}
                qualifyingLeads={qualifyingLeads}
              />
            )}
          </div>

          {/* Outreach preview workspace panel */}
          <div className="lg:col-span-1 h-[600px]">
            <EmailViewer lead={selectedLead} onShowToast={showToast} />
          </div>

        </section>

      </main>

      {/* Pop up form Modal to Add/Edit Leads */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveLead}
        isSubmitting={submittingLead}
        lead={editingLead}
      />
      
      {/* Delete Confirmation Modal */}
      {leadToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={() => setLeadToDelete(null)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-2xl z-10 space-y-4 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-rose-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-bold text-slate-200">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-slate-400">
              Are you sure you want to delete lead <strong className="text-slate-300">{leadToDelete.first_name} {leadToDelete.last_name}</strong>? This action will permanently remove this record from the pipeline.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setLeadToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 bg-transparent border border-slate-800 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteLead}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification System */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-4 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 transform translate-y-0 opacity-100 ${
          toast.type === "success" 
            ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-300"
            : toast.type === "error"
            ? "bg-rose-950/80 border-rose-500/30 text-rose-300"
            : "bg-slate-900/80 border-slate-800 text-slate-300"
        }`}>
          {toast.type === "success" && (
            <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {toast.type === "error" && (
            <svg className="w-5 h-5 text-rose-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {toast.type === "info" && (
            <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-slate-600">
          Mini AI SDR Platform. Orchestrated via LangGraph, OpenAI, and Google Gemini.
        </div>
      </footer>

    </div>
  );
}

