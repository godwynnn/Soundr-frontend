"use client"
import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Link from 'next/link';

function WalletDashboard() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isHypeModalOpen, setIsHypeModalOpen] = useState(false);
  const [pointsToBuy, setPointsToBuy] = useState('');
  const [hypePointsToBuy, setHypePointsToBuy] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'idle', 'pending', 'success', 'reversed', 'failed'
  const [activeReference, setActiveReference] = useState(null);
  const [purchaseResult, setPurchaseResult] = useState(null); // { status: 'success' | 'error', message: string }
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isTransactionDetailModalOpen, setIsTransactionDetailModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [pointsToConvert, setPointsToConvert] = useState('');
  const itemsPerPage = 8;

  const POINT_PRICE = 200; // 1 Support Point = ₦200
  const HYPE_POINT_PRICE = 100; // 1 Hype Point = ₦100
  const nairaEquivalent = pointsToBuy ? parseFloat(pointsToBuy) * POINT_PRICE : 0;
  const hypeNairaEquivalent = hypePointsToBuy ? parseFloat(hypePointsToBuy) * HYPE_POINT_PRICE : 0;

  const closeModals = () => {
    setIsTopUpModalOpen(false);
    setIsHypeModalOpen(false);
    setIsTransactionDetailModalOpen(false);
    setIsConvertModalOpen(false);
    setPurchaseResult(null);
    setPointsToBuy('');
    setHypePointsToBuy('');
    setPointsToConvert('');
  };

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        const response = await fetch(`${API_URL}/api/payment/wallet/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          }
        });

        if (response.ok) {
          const data = await response.json();
          setWalletData(data);
          setTransactions(data.transactions || []);
        }
      } catch (error) {
        console.error("Failed to fetch wallet data:", error);
      } finally {
        setIsFetchingData(false);
      }
    };
    fetchWalletData();
  }, []);

  const handleConfirmPurchase = async (pointType) => {
    const points = pointType === 'support' ? pointsToBuy : hypePointsToBuy;
    const cost = pointType === 'support' ? nairaEquivalent : hypeNairaEquivalent;

    if (!points || parseFloat(points) <= 0) {
      setPurchaseResult({ status: 'error', message: "Please enter a valid amount of points." });
      return;
    }

    if (cost < 1000) {
      setPurchaseResult({ status: 'error', message: "Minimum purchase amount is ₦1,000.00." });
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${API_URL}/api/payment/purchase-points/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          points: parseInt(points),
          point_type: pointType
        })
      });

      const result = await response.json();

      if (response.ok) {
        setWalletData(result.wallet);
        if (result.wallet.transactions) {
          setTransactions(result.wallet.transactions);
        }
        setPurchaseResult({ status: 'success', message: result.message });
      } else {
        setPurchaseResult({ status: 'error', message: result.error || "Purchase failed. Please try again." });
      }
    } catch (error) {
      console.error("Purchase error:", error);
      setPurchaseResult({ status: 'error', message: "An error occurred during the purchase." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertPoints = async () => {
    if (!pointsToConvert || parseInt(pointsToConvert) <= 0) {
      setPurchaseResult({ status: 'error', message: "Please enter a valid number of points." });
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${API_URL}/api/payment/convert-points/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          points: parseInt(pointsToConvert)
        })
      });

      const result = await response.json();

      if (response.ok) {
        setWalletData(result.wallet);
        if (result.wallet.transactions) {
          setTransactions(result.wallet.transactions);
        }
        setPurchaseResult({ status: 'success', message: result.message });
      } else {
        setPurchaseResult({ status: 'error', message: result.error || "Conversion failed. Please try again." });
      }
    } catch (error) {
      console.error("Conversion error:", error);
      setPurchaseResult({ status: 'error', message: "An error occurred during the conversion." });
    } finally {
      setIsLoading(false);
    }
  };


  console.log(paymentStatus, activeReference);
  // Real-time status updates via SSE
  useEffect(() => {
    let eventSource;
    if (activeReference && paymentStatus === 'pending') {
      const token = localStorage.getItem('access_token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Note: Standard EventSource doesn't support headers.
      // We pass the reference in the URL. The backend handles security via session or we can add a token param.
      const url = `${API_URL}/api/payment/stream-status/?reference=${activeReference}&token=${token}`;

      eventSource = new EventSource(url);

      eventSource.onmessage = async (event) => {
        const statusMsg = event.data;

        if (statusMsg === 'success') {
          setPaymentStatus('success');
          eventSource.close();

          // Automatically refresh wallet data
          try {
            const refreshResponse = await fetch(`${API_URL}/api/payment/wallet/`, {
              headers: {
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
              }
            });
            if (refreshResponse.ok) {
              const refreshedData = await refreshResponse.json();
              setWalletData(refreshedData);
              setTransactions(refreshedData.transactions || []);
            }
          } catch (e) {
            console.error("Failed to refresh wallet:", e);
          }

          // Auto-close drawer after delay
          setTimeout(() => {
            setIsDrawerOpen(false);
            setPaymentStatus('idle');
            setActiveReference(null);
            setCheckoutUrl(null);
          }, 4000);
        } else if (statusMsg === 'failed' || statusMsg === 'reversed') {
          setPaymentStatus(statusMsg);
          eventSource.close();
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE connection error:", err);
        eventSource.close();
      };
    }
    return () => {
      if (eventSource) eventSource.close();
    };
  }, [activeReference, paymentStatus]);

  const handleProceedToPayment = async () => {
    if (!amount || parseFloat(amount) < 5) {
      alert("Please enter a valid amount (minimum ₦5.00)");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${API_URL}/api/payment/initialize/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          amount: amount,
          payment_method: selectedMethod
        })
      });

      const data = await response.json();

      if (response.ok && data.data?.authorization_url) {
        setCheckoutUrl(data.data.authorization_url);
        setActiveReference(data.data.reference);
        setPaymentStatus('pending');
      } else {
        alert(data.error || data.message || "Failed to initialize payment.");
      }
    } catch (error) {
      console.error("Payment initialization error:", error);
      alert("Network error occurred while connecting to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const incrementAmount = () => {
    const current = parseFloat(amount || "0");
    setAmount((current + 1).toString());
  };

  const decrementAmount = () => {
    const current = parseFloat(amount || "0");
    if (current > 0) {
      setAmount(Math.max(0, current - 1).toString());
    }
  };

  const handleDownloadReceipt = async (tx) => {
    if (!tx || typeof window === 'undefined') return;

    // Dynamic import to avoid SSR issues if this page is rendered on the server
    const html2pdf = (await import('html2pdf.js')).default;

    // Target the specific container for capture
    const element = document.getElementById(`receipt-modal-content`);
    if (!element) {
      console.error("Receipt element not found!");
      return;
    }

    const opt = {
      margin: 0,
      filename: `receipt-${tx.id.toString().slice(-8)}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#12141a', // Ensure background is solid for the capture
        logging: false
      },
      jsPDF: { unit: 'px', format: [400, 600], orientation: 'portrait', hotfixes: ['px_scaling'] }
    };

    // Use html2pdf to generate and save the PDF
    html2pdf().set(opt).from(element).save();
  };

  // Pagination logic
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, transactions.length);
  const currentTransactions = transactions.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full flex flex-col gap-10 md:gap-12 mt-16 md:mt-0 animate-[fade-in_0.5s_ease-out]">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl md:text-3xl font-black tracking-tight text-white mb-2">Wallet </h1>
          <p className="text-gray-400 font-medium text-sm">Manage your revenue, tracking, and payouts.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-left md:text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Global Rank</p>
            <p className="text-sm font-black text-indigo-400">#142</p>
          </div>
        </div>
      </header>

      {/* Wallet Overview & Top Up Support */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-700 to-purple-900 p-8 text-white shadow-2xl shadow-indigo-500/20 group">
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
            <div>
              <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-1">Total Wallet Balance</p>
              <h3 className="text-5xl font-black tracking-tighter">
                ₦{walletData ? parseFloat(walletData.balance).toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '0.00'}
              </h3>
            </div>
            <div className="flex flex-wrap gap-4 mt-8">
              <button className="px-8 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2 shadow-lg active:scale-95">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Withdraw
              </button>
              <button
                onClick={() => {
                  setIsDrawerOpen(true);
                  setSelectedMethod(null);
                }}
                className="px-6 py-3 bg-white/10 border border-white/20 backdrop-blur-sm text-white font-bold rounded-xl hover:bg-white/20 transition-all flex items-center gap-2 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Add Funds
              </button>
            </div>
          </div>
          {/* Decorative Abstract Shapes */}
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-indigo-400/30 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
        </div>
        <div className="bg-[#12141a] rounded-3xl p-6 border border-white/10 flex flex-col justify-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-10 -mt-10 rounded-full pointer-events-none" />

          <button
            onClick={() => setIsTopUpModalOpen(true)}
            className="z-10 w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            </div>
            Top up support
          </button>

          <button
            onClick={() => setIsHypeModalOpen(true)}
            className="z-10 w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-2xl transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            Buy hype point
          </button>
        </div>
      </div>

      {/* Middle Section: Transaction History & Top Track/Revenue sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transaction History */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-white">Transaction History</h2>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:bg-white/10 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              Filter
            </button>
          </div>
          <div className="bg-[#12141a] rounded-3xl border border-white/10 overflow-hidden flex flex-col flex-1">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase tracking-widest bg-white/[0.02] border-b border-white/10">
                    <th className="px-6 py-5 font-bold">Date</th>
                    <th className="px-6 py-5 font-bold">Type</th>
                    <th className="px-6 py-5 font-bold">Description</th>
                    <th className="px-6 py-5 font-bold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {currentTransactions.length > 0 ? (
                    currentTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-white/5 transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedTransaction(tx);
                          setIsTransactionDetailModalOpen(true);
                        }}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-300">
                          {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${tx.transaction_type === 'deposit'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : tx.transaction_type === 'withdrawal'
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                            {tx.transaction_type || 'Unknown'} ({(tx.status || 'pending').toLowerCase()})
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400 group-hover:text-white transition-colors truncate max-w-[200px]" title={tx.description || `Payment method: ${tx.payment_method}`}>
                          {tx.description || `Via ${tx.payment_method}`}
                        </td>
                        <td className={`px-6 py-4 text-sm font-bold text-right ${tx.transaction_type === 'deposit' ? 'text-emerald-400' : 'text-white'}`}>
                          {tx.transaction_type === 'deposit' ? '+' : ''}₦{parseFloat(tx.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">
                        {isFetchingData ? "Loading transactions..." : "No history found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between mt-auto bg-white/[0.01]">
              <p className="text-xs text-gray-500 font-medium">Showing {transactions.length > 0 ? startIndex + 1 : 0}-{endIndex} of {transactions.length} transactions</p>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`p-1.5 rounded-lg border border-white/10 transition-colors ${currentPage === 1 ? 'opacity-20 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`p-1.5 rounded-lg border border-white/10 transition-colors ${currentPage === totalPages || totalPages === 0 ? 'opacity-20 cursor-not-allowed' : 'text-white hover:bg-white/10 bg-white/5'}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Points Display */}
        <div className="flex flex-col gap-6 h-full pb-8 lg:pb-0">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="text-indigo-500">💎</span> Your Points
            </h2>
          </div>

          <div className="flex flex-col gap-6 flex-1">
            {/* Support Points Card */}
            <div className="bg-[#12141a] rounded-[2rem] border border-white/10 p-8 flex-1 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-10 -mt-10 rounded-full pointer-events-none" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                      <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <button
                      onClick={() => setIsConvertModalOpen(true)}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2 group/btn"
                      title="Convert Points to Naira"
                    >
                      <svg className="w-5 h-5 group-hover/btn:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                      <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Convert</span>
                    </button>
                  </div>
                  <h3 className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] mb-2">Support Points</h3>
                  <p className="text-5xl font-black text-white tracking-tighter">
                    {walletData?.support_points?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Active Balance</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hype Points Card */}
            <div className="bg-[#12141a] rounded-[2rem] border border-white/10 p-8 flex-1 relative overflow-hidden group hover:border-yellow-500/30 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-3xl -mr-10 -mt-10 rounded-full pointer-events-none" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-6 border border-yellow-500/20 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <h3 className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] mb-2">Hype Points</h3>
                  <p className="text-5xl font-black text-white tracking-tighter">
                    {walletData?.hype_points?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Hype Power</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Stats Quick Look & Chart Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-[#12141a] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-2xl -mr-8 -mt-8 rounded-full pointer-events-none" />
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v18l12-18v18" /><line x1="4" y1="10" x2="20" y2="10" /><line x1="4" y1="14" x2="20" y2="14" /></svg>
            Life-time Earnings
          </p>
          <div className="flex flex-col mt-4">
            <span className="text-3xl font-black text-white mb-2">₦14,820</span>
            <span className="text-emerald-400 text-xs font-bold w-fit bg-emerald-400/10 px-2 py-1 rounded-md">↑ 12% vs last yr</span>
          </div>
        </div>
        <div className="p-6 rounded-3xl bg-[#12141a] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-2xl -mr-8 -mt-8 rounded-full pointer-events-none" />
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Avg. Payout
          </p>
          <div className="flex flex-col mt-4">
            <span className="text-3xl font-black text-white mb-2">₦640.00</span>
            <span className="text-gray-500 text-xs font-medium w-fit bg-white/5 px-2 py-1 rounded-md">Monthly baseline</span>
          </div>
        </div>
        <div className="p-6 rounded-3xl bg-[#12141a] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 blur-2xl -mr-8 -mt-8 rounded-full pointer-events-none" />
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
            Top Platform
          </p>
          <div className="flex justify-between items-end mt-4">
            <span className="text-3xl font-black text-white">Spotify</span>
            <span className="text-gray-500 text-xs font-medium mb-1">42% of revenue</span>
          </div>
        </div>
      </div>

      {/* Payment Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fade_0.2s_ease-out_forwards]"
            onClick={() => setIsDrawerOpen(false)}
          ></div>

          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-[#12141a] h-full shadow-2xl border-l border-white/10 flex flex-col animate-[slideIn_0.3s_ease-out_forwards]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              {selectedMethod || checkoutUrl ? (
                <div className="flex items-center gap-3 animate-[fade_0.2s_ease-out]">
                  <button
                    onClick={() => {
                      if (checkoutUrl) setCheckoutUrl(null);
                      else setSelectedMethod(null);
                    }}
                    className="p-2 -ml-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h2 className="text-xl font-bold text-white tracking-tight">{checkoutUrl ? "Complete Payment" : "Enter Amount"}</h2>
                </div>
              ) : paymentStatus === 'success' || paymentStatus === 'failed' || paymentStatus === 'reversed' ? (
                <h2 className="text-xl font-bold text-white tracking-tight animate-[fade_0.2s_ease-out]">Payment Result</h2>
              ) : (
                <h2 className="text-xl font-bold text-white tracking-tight animate-[fade_0.2s_ease-out]">Select Payment Option</h2>
              )}
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  setTimeout(() => {
                    setSelectedMethod(null);
                    setCheckoutUrl(null);
                    setAmount('');
                  }, 300);
                }}
                className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className={`flex flex-col gap-4 overflow-y-auto flex-1 ${checkoutUrl && paymentStatus === 'pending' ? 'p-0 bg-white rounded-b-xl' : 'p-6'}`}>
              {paymentStatus === 'success' ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-[fade_0.4s_ease-out]">
                  <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 animate-[bounce_1s_infinite]">
                    <svg className="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Payment Successful!</h3>
                  <p className="text-gray-400 font-medium mb-8">Your wallet balance has been updated successfully.</p>
                  <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                    <span className="text-gray-500 text-sm font-bold uppercase tracking-wider">Amount Added</span>
                    <span className="text-2xl font-black text-emerald-400">₦{parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <p className="mt-12 text-xs text-gray-600 animate-pulse">Closing drawer in a few seconds...</p>
                </div>
              ) : (paymentStatus === 'failed' || paymentStatus === 'reversed') ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-[fade_0.4s_ease-out]">
                  <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Payment {paymentStatus === 'reversed' ? 'Reversed' : 'Failed'}</h3>
                  <p className="text-gray-400 font-medium mb-8">Something went wrong with your transaction. Please try again or contact support.</p>
                  <button
                    onClick={() => {
                      setPaymentStatus('idle');
                      setCheckoutUrl(null);
                      setActiveReference(null);
                    }}
                    className="w-full py-4 bg-white/10 border border-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
                  >
                    Try Another Method
                  </button>
                </div>
              ) : checkoutUrl ? (
                <div className="flex-1 w-full h-full animate-[fade_0.4s_ease-out] relative">
                  {/* Centralized processing loader if payment status is pending */}
                  <iframe
                    src={checkoutUrl}
                    className="w-full h-full border-0 min-h-[600px] rounded-b-xl"
                    allow="payment"
                  />
                </div>
              ) : !selectedMethod ? (
                <div className="flex flex-col gap-4 animate-[slideIn_0.3s_ease-out_forwards]">
                  {/* Paystack Button */}
                  <button onClick={() => setSelectedMethod('paystack')} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] group">
                    <div className="w-12 h-12 rounded-full bg-[#0ba4db]/10 flex items-center justify-center group-hover:bg-[#0ba4db]/20 transition-colors">
                      <span className="text-[#0ba4db] font-black text-xl">P</span>
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-white font-bold group-hover:text-[#0ba4db] transition-colors">Paystack</h3>
                      <p className="text-gray-400 text-xs mt-0.5">Credit/Debit Cards, Bank Transfer</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>

                  {/* Flutterwave Button */}
                  <button onClick={() => setSelectedMethod('flutterwave')} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] group">
                    <div className="w-12 h-12 rounded-full bg-[#f5a623]/10 flex items-center justify-center group-hover:bg-[#f5a623]/20 transition-colors">
                      <span className="text-[#f5a623] font-black text-xl">F</span>
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-white font-bold group-hover:text-[#f5a623] transition-colors">Flutterwave</h3>
                      <p className="text-gray-400 text-xs mt-0.5">Mobile Money, Cards, Bank</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>

                  {/* Stripe Button */}
                  <button onClick={() => setSelectedMethod('stripe')} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] group">
                    <div className="w-12 h-12 rounded-full bg-[#635bff]/10 flex items-center justify-center group-hover:bg-[#635bff]/20 transition-colors">
                      <span className="text-[#635bff] font-black text-xl">S</span>
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-white font-bold group-hover:text-[#635bff] transition-colors">Stripe</h3>
                      <p className="text-gray-400 text-xs mt-0.5">International Cards, Apple Pay</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col h-full animate-[slideIn_0.3s_ease-out_forwards]">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Amount to Add</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={decrementAmount}
                          className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all font-bold text-2xl"
                        >
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" /></svg>
                        </button>

                        <div className="relative flex-1">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">₦</span>
                          <input
                            type="number"
                            placeholder="0.00"
                            min="0"
                            value={amount}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "" || parseFloat(val) >= 0) {
                                setAmount(val);
                              }
                            }}
                            className="w-full bg-[#12141a] border border-white/20 rounded-xl pl-10 pr-4 py-4 text-2xl font-black text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-600 text-center"
                            autoFocus
                          />
                        </div>

                        <button
                          onClick={incrementAmount}
                          className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all font-bold text-2xl"
                        >
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Minimum amount is ₦5.00</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 flex flex-col gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Method</span>
                      </div>
                      <span className="font-bold text-white capitalize">{selectedMethod}</span>
                    </div>

                    <button
                      onClick={handleProceedToPayment}
                      disabled={isLoading}
                      className="w-full relative py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                          Processing...
                        </div>
                      ) : (
                        "Proceed to Payment"
                      )}
                    </button>

                    <p className="text-xs text-center text-gray-500 flex items-center justify-center gap-1 mt-2">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      Payments are secure and encrypted
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Up Support Modal */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-[fade_0.3s_ease-out_forwards]"
            onClick={closeModals}
          ></div>

          {/* Modal Panel */}
          <div className="relative w-full max-w-md bg-[#12141a] rounded-[2.5rem] border border-white/10 p-8 shadow-2xl animate-[zoomIn_0.3s_ease-out_forwards] overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 ${purchaseResult?.status === 'success' ? 'bg-emerald-500/10' : purchaseResult?.status === 'error' ? 'bg-red-500/10' : 'bg-indigo-500/10'} blur-3xl -mr-10 -mt-10 rounded-full pointer-events-none`} />

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Top Up Support</h2>
                  <p className="text-gray-400 text-sm font-medium mt-1">Acquire points to support creators.</p>
                </div>
                <button
                  onClick={closeModals}
                  className="p-2 rounded-full bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {purchaseResult ? (
                <div className="flex flex-col items-center py-6 text-center animate-[fade_0.3s_ease-out]">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${purchaseResult.status === 'success' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                    {purchaseResult.status === 'success' ? (
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2 tracking-tight">{purchaseResult.status === 'success' ? "Success!" : "Purchase Failed"}</h3>
                  <p className="text-gray-400 font-medium mb-10 leading-relaxed max-w-[260px]">{purchaseResult.message}</p>
                  <button
                    onClick={closeModals}
                    className="w-full py-5 bg-white text-[#12141a] font-black rounded-2xl hover:bg-white/90 transition-all shadow-xl active:scale-95"
                  >
                    Got it
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Points Input */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Points to buy</label>
                    <div className="relative group">
                      <input
                        type="number"
                        placeholder="Enter points count"
                        value={pointsToBuy}
                        onChange={(e) => setPointsToBuy(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 transition-all text-xl"
                        autoFocus
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 font-bold text-sm bg-indigo-400/10 px-2 py-1 rounded-md">POINTS</div>
                    </div>
                  </div>

                  {/* Naira Equivalent (Disabled) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Naira Equivalent</label>
                    <div className="relative">
                      <input
                        type="text"
                        disabled
                        value={`₦${nairaEquivalent.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`}
                        className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-12 py-4 text-gray-400 font-black text-xl cursor-not-allowed"
                      />
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 text-xl font-bold">₦</span>
                    </div>
                    <p className="text-[10px] text-gray-600 font-medium ml-1 italic">
                      Current rate: 1 Support Point = ₦200.00. (Min purchase: ₦1,000.00)
                    </p>
                  </div>

                  <button
                    className="w-full py-5 bg-white text-indigo-900 font-black rounded-2xl hover:bg-slate-100 transition-all shadow-xl active:scale-95 mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
                    onClick={() => handleConfirmPurchase('support')}
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing..." : "Confirm Purchase"}
                    {!isLoading && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hype Point Modal */}
      {isHypeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-[fade_0.3s_ease-out_forwards]"
            onClick={closeModals}
          ></div>

          {/* Modal Panel */}
          <div className="relative w-full max-w-md bg-[#12141a] rounded-[2.5rem] border border-white/10 p-8 shadow-2xl animate-[zoomIn_0.3s_ease-out_forwards] overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 ${purchaseResult?.status === 'success' ? 'bg-emerald-500/10' : purchaseResult?.status === 'error' ? 'bg-red-500/10' : 'bg-yellow-500/10'} blur-3xl -mr-10 -mt-10 rounded-full pointer-events-none`} />

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <span className="text-yellow-500">⚡</span> Buy Hype Points
                  </h2>
                  <p className="text-gray-400 text-sm font-medium mt-1">Boost visibility and hype for your tracks.</p>
                </div>
                <button
                  onClick={closeModals}
                  className="p-2 rounded-full bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {purchaseResult ? (
                <div className="flex flex-col items-center py-6 text-center animate-[fade_0.3s_ease-out]">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${purchaseResult.status === 'success' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                    {purchaseResult.status === 'success' ? (
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2 tracking-tight">{purchaseResult.status === 'success' ? "Success!" : "Purchase Failed"}</h3>
                  <p className="text-gray-400 font-medium mb-10 leading-relaxed max-w-[260px]">{purchaseResult.message}</p>
                  <button
                    onClick={closeModals}
                    className="w-full py-5 bg-white text-[#12141a] font-black rounded-2xl hover:bg-white/90 transition-all shadow-xl active:scale-95"
                  >
                    Got it
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Points Input */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Hype points to buy</label>
                    <div className="relative group">
                      <input
                        type="number"
                        placeholder="Enter points count"
                        value={hypePointsToBuy}
                        onChange={(e) => setHypePointsToBuy(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold placeholder:text-gray-600 focus:outline-none focus:border-yellow-500 transition-all text-xl"
                        autoFocus
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-500 font-bold text-sm bg-yellow-500/10 px-2 py-1 rounded-md">HYPE</div>
                    </div>
                  </div>

                  {/* Naira Equivalent (Disabled) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Naira Equivalent</label>
                    <div className="relative">
                      <input
                        type="text"
                        disabled
                        value={`₦${hypeNairaEquivalent.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`}
                        className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-12 py-4 text-gray-400 font-black text-xl cursor-not-allowed"
                      />
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 text-xl font-bold">₦</span>
                    </div>
                    <p className="text-[10px] text-gray-600 font-medium ml-1 italic">
                      Current rate: 1 Hype Point = ₦100.00. (Min purchase: ₦1,000.00)
                    </p>
                  </div>

                  <button
                    className="w-full py-5 bg-yellow-500 text-black font-black rounded-2xl hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/10 active:scale-95 mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
                    onClick={() => handleConfirmPurchase('hype')}
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing..." : "Buy Hype"}
                    {!isLoading && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {isTransactionDetailModalOpen && selectedTransaction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-[fade_0.3s_ease-out_forwards]"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
            onClick={() => setIsTransactionDetailModalOpen(false)}
          ></div>

          <div
            id="receipt-modal-content"
            className="relative w-full max-w-md rounded-[2.5rem] border shadow-2xl animate-[zoomIn_0.3s_ease-out_forwards] overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #12141a 0%, #0e0f11 100%)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div
              className="absolute top-0 right-0 w-64 h-64 blur-[80px] -mr-24 -mt-24 rounded-full pointer-events-none opacity-40"
              style={{ background: selectedTransaction.transaction_type === 'deposit' ? 'radial-gradient(circle, #10b981 0%, transparent 70%)' : 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
            />

            <div className="relative z-10 p-8">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg" style={{ backgroundColor: '#4f46e5', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.2)' }}>S</div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight" style={{ color: '#ffffff' }}>Receipt</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6b7280' }}>ID: {selectedTransaction.id.toString().slice(-8)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsTransactionDetailModalOpen(false)}
                  className="p-2 rounded-full transition-colors"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#6b7280' }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex flex-col items-center mb-10">
                <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: '#9ca3af' }}>{selectedTransaction.transaction_type} Amount</p>
                <h3 className="text-5xl font-black tracking-tighter" style={{ color: selectedTransaction.transaction_type === 'deposit' ? '#10b981' : '#ffffff' }}>
                  ₦{parseFloat(selectedTransaction.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </h3>
                <div className="mt-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border" style={{
                  backgroundColor: selectedTransaction.status === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: selectedTransaction.status === 'success' ? '#10b981' : '#f59e0b',
                  borderColor: selectedTransaction.status === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'
                }}>
                  {selectedTransaction.status}
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase" style={{ color: '#6b7280' }}>Date & Time</span>
                  <span className="text-sm font-medium" style={{ color: '#d1d5db' }}>{new Date(selectedTransaction.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase" style={{ color: '#6b7280' }}>Method</span>
                  <span className="text-sm font-medium capitalize" style={{ color: '#d1d5db' }}>{selectedTransaction.payment_method || 'Wallet Balance'}</span>
                </div>
                <div className="flex flex-col gap-1.5 pt-2">
                  <span className="text-xs font-bold uppercase" style={{ color: '#6b7280' }}>Description</span>
                  <p className="text-sm leading-relaxed p-3 rounded-xl border line-clamp-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#d1d5db', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                    {selectedTransaction.description || `Transaction of ₦${parseFloat(selectedTransaction.amount).toFixed(2)} via ${selectedTransaction.payment_method || 'Internal'}`}
                  </p>
                </div>
              </div>

              <div className="mt-10" data-html2canvas-ignore="true">
                <button
                  onClick={() => handleDownloadReceipt(selectedTransaction)}
                  className="w-full py-4 font-black rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#ffffff', color: '#12141a' }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert Points Modal */}
      {isConvertModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-[fade_0.3s_ease-out_forwards]"
            onClick={closeModals}
          ></div>
          <div className="relative w-full max-w-md bg-[#12141a] rounded-[2.5rem] border border-white/10 shadow-2xl animate-[zoomIn_0.3s_ease-out_forwards] overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-3xl -mr-16 -mt-16 rounded-full pointer-events-none" />

            <div className="relative z-10 p-8">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight">Convert Points</h2>
                </div>
                <button onClick={closeModals} className="p-2 rounded-full bg-white/5 text-gray-500 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {purchaseResult ? (
                <div className="py-12 flex flex-col items-center text-center animate-[fade_0.3s_ease-out]">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${purchaseResult.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-500'}`}>
                    {purchaseResult.status === 'success' ? (
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">{purchaseResult.status === 'success' ? 'Conversion Successful!' : 'Conversion Failed'}</h3>
                  <p className="text-gray-400 leading-relaxed mb-10 px-4">{purchaseResult.message}</p>
                  <button onClick={closeModals} className="px-10 py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-100 transition-all active:scale-95">Got it</button>
                </div>
              ) : (
                <>
                  <div className="mb-8 p-6 rounded-3xl bg-white/[0.02] border border-white/5 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Available Support Points</p>
                    <p className="text-4xl font-black text-white tracking-tighter">{walletData?.support_points?.toLocaleString() || '0'}</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3 block px-1">Points to Convert</label>
                      <div className="relative group">
                        <input
                          type="number"
                          value={pointsToConvert}
                          onChange={(e) => setPointsToConvert(e.target.value)}
                          placeholder="0"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-2xl font-black text-white placeholder:text-gray-700 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <span className="text-xs font-black text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-md">POINTS</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-emerald-400/5 border border-emerald-400/10 flex justify-between items-center group hover:bg-emerald-400/10 transition-all">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 mb-1">You will receive</p>
                        <p className="text-3xl font-black text-emerald-400 tracking-tighter">
                          ₦{(parseInt(pointsToConvert || 0) * 200).toLocaleString()}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-400/10 flex items-center justify-center text-emerald-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                    </div>

                    <button
                      disabled={isLoading || !pointsToConvert || parseInt(pointsToConvert) <= 0 || parseInt(pointsToConvert) > (walletData?.support_points || 0)}
                      onClick={handleConvertPoints}
                      className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-2xl flex items-center justify-center gap-3"
                    >
                      {isLoading ? (
                        <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                      ) : (
                        <>Confirm Conversion</>
                      )}
                    </button>

                    <p className="text-[10px] text-center text-gray-500 font-bold uppercase tracking-widest">
                      1 point = ₦200.00
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style jsx global>{`
        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes fade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default function WalletPage() {
  return (
    <AuthGuard>
      <WalletDashboard />
    </AuthGuard>
  );
}
