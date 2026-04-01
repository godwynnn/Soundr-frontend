"use client";

import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, type = 'danger' }) => {
  if (!isOpen) return null;

  const getButtonStyles = () => {
    if (type === 'danger') {
      return "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-[0_0_20px_rgba(225,29,72,0.4)]";
    }
    return "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(139,92,246,0.4)]";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-[#13151a] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 fade-in slide-in-from-bottom-8 duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[60px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Icon */}
          <div className={`size-16 rounded-3xl flex items-center justify-center mb-6 ${type === 'danger' ? 'bg-red-500/20 text-red-400' : 'bg-violet-500/20 text-violet-400'}`}>
            {type === 'danger' ? (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          <h3 className="text-2xl font-black text-white tracking-tight mb-3">
            {title || "Are you sure?"}
          </h3>
          
          <p className="text-gray-400 font-medium mb-8 leading-relaxed">
            {message || "Do you really want to proceed? This action may be irreversible."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 px-8 py-3.5 bg-white/5 border border-white/10 text-gray-300 rounded-2xl font-bold text-sm tracking-widest hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {cancelText || "Cancel"}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-8 py-3.5 ${getButtonStyles()} text-white rounded-2xl font-bold text-sm tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg`}
            >
              {confirmText || "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
