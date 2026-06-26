import React, { useState, useEffect } from "react";

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leadData: {
    first_name: string;
    last_name: string;
    company: string;
    job_title: string;
    email: string;
    phone?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
  lead?: {
    first_name: string;
    last_name: string;
    company: string;
    job_title: string;
    email: string;
    phone?: string;
  } | null;
}

export default function LeadModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  lead = null
}: LeadModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Set fields on modal open/close depending on editing or creating
  useEffect(() => {
    if (isOpen) {
      if (lead) {
        setFirstName(lead.first_name || "");
        setLastName(lead.last_name || "");
        setCompany(lead.company || "");
        setJobTitle(lead.job_title || "");
        setEmail(lead.email || "");
        setPhone(lead.phone || "");
      } else {
        setFirstName("");
        setLastName("");
        setCompany("");
        setJobTitle("");
        setEmail("");
        setPhone("");
      }
      setFormError(null);
    }
  }, [isOpen, lead]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Simple validation
    if (!firstName.trim() || !lastName.trim() || !company.trim() || !jobTitle.trim() || !email.trim()) {
      setFormError("Please fill in all required fields.");
      return;
    }

    try {
      await onSubmit({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        company: company.trim(),
        job_title: jobTitle.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined
      });
      onClose();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to submit lead.";
      setFormError(errMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <h3 className="text-lg font-semibold text-slate-200">
            {lead ? "Edit Lead Profile" : "Add New Lead Profile"}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {formError && (
              <div className="p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full px-3 py-2 text-sm text-slate-200 bg-slate-950/50 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-3 py-2 text-sm text-slate-200 bg-slate-950/50 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Work Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@company.com"
                className="w-full px-3 py-2 text-sm text-slate-200 bg-slate-950/50 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full px-3 py-2 text-sm text-slate-200 bg-slate-950/50 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Job Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="VP of Sales"
                  className="w-full px-3 py-2 text-sm text-slate-200 bg-slate-950/50 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full px-3 py-2 text-sm text-slate-200 bg-slate-950/50 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end items-center space-x-3 p-6 border-t border-slate-800 bg-slate-900/50">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-400 bg-transparent border border-slate-800 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Lead"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
