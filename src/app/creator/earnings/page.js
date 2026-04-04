"use client"
import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Link from 'next/link';

function EarningsDashboard() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isFetchingData, setIsFetchingData] = useState(true);

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

  const handleProceedToPayment = async () => {
    if (!amount || parseFloat(amount) < 5) {
      alert("Please enter a valid amount (minimum $5.00)");
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

  return (
    <div className="max-w-[1600px] mx-auto w-full flex flex-col gap-10 md:gap-12 mt-16 md:mt-0 animate-[fade-in_0.5s_ease-out]">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl md:text-3xl font-black tracking-tight text-white mb-2">Wallet & Earnings</h1>
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
                ${walletData ? parseFloat(walletData.balance).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
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
        <div className="bg-[#12141a] rounded-3xl p-6 border border-white/10 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-10 -mt-10 rounded-full pointer-events-none" />
          <div className="z-10">
            <p className="text-gray-400 text-sm font-medium mb-4">Pending Clearance</p>
            <h4 className="text-4xl font-black text-white">$420.50</h4>
            <p className="text-xs text-indigo-400 mt-3 flex items-center gap-1 font-medium bg-indigo-400/10 w-fit px-2 py-1.5 rounded-md">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Available in 3 days
            </p>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10 z-10">
            <p className="text-gray-500 text-sm font-medium mb-1">Next Payout Date</p>
            <p className="text-xl font-black text-white">Oct 15, 2026</p>
          </div>
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
                  {transactions.length > 0 ? (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
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
                          {tx.transaction_type === 'deposit' ? '+' : ''}${parseFloat(tx.amount).toFixed(2)}
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
              <p className="text-xs text-gray-500 font-medium">Showing {transactions.length} transactions</p>
              <div className="flex gap-2">
                <button className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button className="p-1.5 rounded-lg border border-white/10 text-white hover:bg-white/10 transition-colors bg-white/5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Track */}
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="text-yellow-500">🏆</span> Top Track
            </h2>
          </div>
          <div className="bg-[#12141a] rounded-3xl border border-white/10 flex flex-col overflow-hidden h-full">
            <div className="flex-1 flex flex-col relative group">
              {/* Background art */}
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-50 transition-all group-hover:scale-105 duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#12141a] via-[#12141a]/80 to-[#12141a]/20" />

              <div className="relative z-10 p-6 md:p-8 flex flex-col h-full justify-end">
                <span className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-3 border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 rounded-full w-fit">Top Earner</span>
                <h3 className="text-3xl font-black text-white drop-shadow-md tracking-tight">Midnight Echoes</h3>
                <p className="text-gray-300 font-medium text-sm mt-1">Synthwave Collection</p>

                <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center bg-black/20 rounded-2xl p-4 backdrop-blur-md">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Generated</p>
                    <p className="text-2xl font-black text-emerald-400">$845.20</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Streams</p>
                    <p className="text-xl font-bold text-white">124.5K</p>
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
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Life-time Earnings
          </p>
          <div className="flex flex-col mt-4">
            <span className="text-3xl font-black text-white mb-2">$14,820</span>
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
            <span className="text-3xl font-black text-white mb-2">$640.00</span>
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

            <div className={`flex flex-col gap-4 overflow-y-auto flex-1 ${checkoutUrl ? 'p-0 bg-white rounded-b-xl' : 'p-6'}`}>
              {checkoutUrl ? (
                <div className="flex-1 w-full h-full animate-[fade_0.4s_ease-out]">
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
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full bg-[#12141a] border border-white/20 rounded-xl px-10 py-4 text-2xl font-black text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-600"
                          autoFocus
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Minimum amount is $5.00</p>
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

      <style jsx global>{`
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

export default function EarningsPage() {
  return (
    <AuthGuard>
      <EarningsDashboard />
    </AuthGuard>
  );
}
