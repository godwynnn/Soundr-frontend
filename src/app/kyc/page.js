"use client";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function KYCVerificationPage() {
  const router = useRouter();
  const { user, accessToken } = useSelector((state) => state.auth);

  // 'none' | 'pending' | 'approved' | 'rejected'
  const [kycStatus, setKycStatus] = useState("none");
  const [rejectionReason, setRejectionReason] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    address: "",
    governmentId: null,
    selfie: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("submission"); // 'submission', 'support'

  useEffect(() => {
    const fetchKycStatus = async () => {
      if (!user) return;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kyc/status/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setKycStatus(data.status || 'none');
          if (data.rejection_reason) {
            setRejectionReason(data.rejection_reason);
          }
        }
      } catch (error) {
        console.error("Failed to fetch KYC status:", error);
      }
    };

    fetchKycStatus();
  }, [user, accessToken]);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.governmentId || !formData.selfie) {
      alert("Please upload both Government ID and Selfie.");
      return;
    }

    setIsSubmitting(true);

    const submitData = new FormData();
    submitData.append('fullName', formData.fullName);
    submitData.append('dob', formData.dob);
    submitData.append('address', formData.address);
    submitData.append('governmentId', formData.governmentId);
    submitData.append('selfie', formData.selfie);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kyc/submit/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Submission failed');
      }

      setKycStatus("pending");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("KYC Submit error:", error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusDisplay = () => {
    if (kycStatus === "pending") {
      return (
        <div className="bg-[#1a1b1e]/80 border border-amber-500/30 rounded-[2rem] p-8 text-center backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in duration-700">
          <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-amber-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter mb-4">Verification Pending</h2>
          <p className="text-gray-400 font-medium max-w-md mx-auto mb-8">
            Your documents have been submitted and are currently under review by our compliance team. This typically takes 24-48 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/profile/${user?.id}`} className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold transition-all">
              Return to Profile
            </Link>
          </div>
        </div>
      );
    }

    if (kycStatus === "approved") {
      return (
        <div className="bg-[#1a1b1e]/80 border border-emerald-500/30 rounded-[2rem] p-8 text-center backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in duration-700">
          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter mb-4">Identity Verified</h2>
          <p className="text-gray-400 font-medium max-w-md mx-auto mb-8">
            Congratulations! Your identity has been successfully verified. You now have full access to payouts and monetization features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/wallet" className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20">
              Go to Wallet
            </Link>
            <Link href={`/profile/${user?.id}`} className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold transition-all">
              Return to Profile
            </Link>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0e0f11] text-white pt-24 pb-12 px-4 md:px-8">

        {/* Background Ambient Glow */}
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">

          {/* Header */}
          <div className="mb-12 text-center md:text-left">
            <Link href={`/profile/${user?.id}`} className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold text-sm tracking-widest uppercase mb-6 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Profile
            </Link>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">KYC Verification</h1>
            <p className="text-gray-400 font-medium max-w-2xl text-lg">
              Verify your identity to comply with regulations and unlock monetization on Soundr. Your personal information is encrypted and securely stored.
            </p>
          </div>

          {kycStatus === "none" || kycStatus === "rejected" ? (
            <div className="bg-[#131417]/90 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-md">

              {/* Tabs */}
              <div className="flex border-b border-white/5">
                <button
                  onClick={() => setActiveTab("submission")}
                  className={`flex-1 py-5 text-sm font-black uppercase tracking-widest transition-colors ${activeTab === "submission" ? "text-indigo-400 border-b-2 border-indigo-400" : "text-gray-500 hover:text-gray-300"}`}
                >
                  Submission Form
                </button>
                <button
                  onClick={() => setActiveTab("support")}
                  className={`flex-1 py-5 text-sm font-black uppercase tracking-widest transition-colors ${activeTab === "support" ? "text-indigo-400 border-b-2 border-indigo-400" : "text-gray-500 hover:text-gray-300"}`}
                >
                  Support & Guidance
                </button>
              </div>

              <div className="p-8 md:p-12">
                {kycStatus === "rejected" && (
                  <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <div className="flex items-start gap-4">
                      <svg className="w-6 h-6 text-red-500 mt-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h3 className="text-red-400 font-bold mb-1">Verification Rejected</h3>
                        <p className="text-sm text-red-200/70">{rejectionReason || "Your document was illegible. Please upload a high-resolution, uncropped image of your ID."}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "submission" && (
                  <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-500">Full Legal Name</label>
                        <input
                          type="text"
                          name="fullName"
                          required
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="As it appears on your ID"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-medium"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-500">Date of Birth</label>
                        <input
                          type="date"
                          name="dob"
                          required
                          value={formData.dob}
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500">Residential Address</label>
                      <input
                        type="text"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="House Number, Street Name, City, Country"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">

                      {/* Govt ID */}
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase tracking-widest text-gray-500">Government ID</label>
                          <p className="text-[10px] text-gray-600 uppercase tracking-wider font-bold">JPG, PNG, PDF (Max 5MB)</p>
                        </div>

                        <div className={`border-2 border-dashed ${formData.governmentId ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 bg-white/5 hover:border-indigo-500/40 hover:bg-white/10'} rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative group h-48`}>
                          <input
                            type="file"
                            name="governmentId"
                            required
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={handleInputChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {formData.governmentId ? (
                            <>
                              <svg className="w-8 h-8 text-emerald-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              <span className="text-xs font-bold text-emerald-400 truncate w-full px-4">{formData.governmentId.name}</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-8 h-8 text-gray-500 mb-3 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                              <span className="text-sm font-bold text-gray-400">Click to upload or drag & drop</span>
                              <span className="text-xs font-medium text-gray-600 mt-2">Passport, Driver's License, or National ID</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Selfie */}
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase tracking-widest text-gray-500">Selfie Verification</label>
                          <p className="text-[10px] text-gray-600 uppercase tracking-wider font-bold">JPG, PNG (Max 5MB)</p>
                        </div>

                        <div className={`border-2 border-dashed ${formData.selfie ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 bg-white/5 hover:border-indigo-500/40 hover:bg-white/10'} rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative group h-48`}>
                          <input
                            type="file"
                            name="selfie"
                            required
                            accept=".jpg,.jpeg,.png"
                            onChange={handleInputChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {formData.selfie ? (
                            <>
                              <svg className="w-8 h-8 text-emerald-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              <span className="text-xs font-bold text-emerald-400 truncate w-full px-4">{formData.selfie.name}</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-8 h-8 text-gray-500 mb-3 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              <span className="text-sm font-bold text-gray-400">Upload a clear photo of your face</span>
                              <span className="text-xs font-medium text-gray-600 mt-2">Ensure good lighting and no accessories</span>
                            </>
                          )}
                        </div>
                      </div>

                    </div>

                    <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                      {/* <p className="text-xs text-gray-500 font-medium">
                        By submitting this form, you agree to our <Link href="#" className="underline hover:text-indigo-400">Terms of Service</Link> and <Link href="#" className="underline hover:text-indigo-400">Privacy Policy</Link>.
                      </p> */}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl transition-all shadow-xl shadow-indigo-500/20 whitespace-nowrap flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : "Submit Documentation"}
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === "support" && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h3>
                      <div className="space-y-4">
                        {[
                          { q: "Why do I need to verify my identity?", a: "KYC (Know Your Customer) is a legal requirement for financial processing to prevent fraud and money laundering. As you will be receiving payouts, we must verify who you are." },
                          { q: "What documents are accepted?", a: "We accept government-issued IDs including Passports, National Identity Cards, and Driver's Licenses. The document must be valid and not expired." },
                          { q: "How long does verification take?", a: "Most verifications are processed within 24-48 hours. During peak times, it may take up to 3 business days." },
                          { q: "Why was my document rejected?", a: "Common reasons include: the document is expired, the photo is blurry or cropped, poor lighting on the selfie, or the details don't match the form input." }
                        ].map((faq, i) => (
                          <div key={i} className="bg-white/5 rounded-xl p-5 border border-white/5">
                            <h4 className="font-bold text-white mb-2">{faq.q}</h4>
                            <p className="text-sm text-gray-400">{faq.a}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div>
                        <h4 className="font-bold text-white mb-1">Still need help?</h4>
                        <p className="text-sm text-gray-400">Our support team is available 24/7 to assist with verification issues.</p>
                      </div>
                      <a href="mailto:support@soundr.com" className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl border border-white/10 transition-colors whitespace-nowrap">
                        Contact Support
                      </a>
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="mt-8">
              {renderStatusDisplay()}
            </div>
          )}

        </div>
      </div>
    </AuthGuard>
  );
}
