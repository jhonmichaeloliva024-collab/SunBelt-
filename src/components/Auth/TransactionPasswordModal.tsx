import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Delete,
  RotateCcw,
} from 'lucide-react';
import { useGFlix } from '../../context/GFlixContext';

export const TransactionPasswordModal: React.FC = () => {
  const {
    showTransactionPasswordModal,
    transactionPasswordModalMode,
    closeTransactionPasswordModal,
    saveTransactionPassword,
    verifyTransactionPassword,
    currentUser,
    showToast,
  } = useGFlix();

  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [currentPin, setCurrentPin] = useState<string>('');
  const [showPinText, setShowPinText] = useState<boolean>(false);
  const [activeTarget, setActiveTarget] = useState<'pin' | 'confirm' | 'current'>('pin');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const isSetup = transactionPasswordModalMode === 'setup';
  const isChange = transactionPasswordModalMode === 'change';
  const isVerify = transactionPasswordModalMode === 'verify';

  // Reset inputs when modal opens or mode changes
  useEffect(() => {
    if (showTransactionPasswordModal) {
      setPin('');
      setConfirmPin('');
      setCurrentPin('');
      setErrorMsg('');
      setActiveTarget(isChange && currentUser?.hasTransactionPassword ? 'current' : 'pin');
    }
  }, [showTransactionPasswordModal, transactionPasswordModalMode, currentUser]);

  if (!showTransactionPasswordModal) return null;

  const handleDigitPress = (digit: string) => {
    setErrorMsg('');
    if (activeTarget === 'current') {
      if (currentPin.length < 6) {
        const next = currentPin + digit;
        setCurrentPin(next);
        if (next.length === 6) setActiveTarget('pin');
      }
    } else if (activeTarget === 'pin') {
      if (pin.length < 6) {
        const next = pin + digit;
        setPin(next);
        if (next.length === 6 && (isSetup || isChange)) {
          setActiveTarget('confirm');
        }
      }
    } else if (activeTarget === 'confirm') {
      if (confirmPin.length < 6) {
        setConfirmPin(confirmPin + digit);
      }
    }
  };

  const handleBackspace = () => {
    setErrorMsg('');
    if (activeTarget === 'confirm') {
      if (confirmPin.length > 0) {
        setConfirmPin(confirmPin.slice(0, -1));
      } else {
        setActiveTarget('pin');
      }
    } else if (activeTarget === 'pin') {
      if (pin.length > 0) {
        setPin(pin.slice(0, -1));
      } else if (isChange && currentUser?.hasTransactionPassword) {
        setActiveTarget('current');
      }
    } else if (activeTarget === 'current') {
      setCurrentPin(currentPin.slice(0, -1));
    }
  };

  const handleClearAll = () => {
    setPin('');
    setConfirmPin('');
    setCurrentPin('');
    setErrorMsg('');
    setActiveTarget(isChange && currentUser?.hasTransactionPassword ? 'current' : 'pin');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (isVerify) {
      if (pin.length !== 6) {
        setErrorMsg('Please enter your 6-digit transaction password.');
        return;
      }
      const isValid = verifyTransactionPassword(pin);
      if (isValid) {
        closeTransactionPasswordModal();
      } else {
        setErrorMsg('Incorrect transaction password. Please try again.');
        showToast('Incorrect transaction password', 'error');
      }
      return;
    }

    // Change mode requires verifying old PIN
    if (isChange && currentUser?.hasTransactionPassword) {
      if (currentPin.length !== 6) {
        setErrorMsg('Please enter your current 6-digit transaction password.');
        setActiveTarget('current');
        return;
      }
      if (!verifyTransactionPassword(currentPin)) {
        setErrorMsg('Current transaction password does not match.');
        setActiveTarget('current');
        return;
      }
    }

    if (pin.length !== 6) {
      setErrorMsg('Transaction password must be exactly 6 digits.');
      setActiveTarget('pin');
      return;
    }

    if (confirmPin.length !== 6) {
      setErrorMsg('Please confirm your 6-digit transaction password.');
      setActiveTarget('confirm');
      return;
    }

    if (pin !== confirmPin) {
      setErrorMsg('Transaction passwords do not match. Please verify.');
      setActiveTarget('confirm');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await saveTransactionPassword(pin, currentPin);
      setIsSubmitting(false);
      if (!res.success) {
        setErrorMsg(res.message);
      }
    } catch {
      setIsSubmitting(false);
      setErrorMsg('Failed to save transaction password. Please try again.');
    }
  };

  // Render 6-digit cell display
  const renderPinCells = (
    value: string,
    targetName: 'pin' | 'confirm' | 'current',
    label: string,
    isRequired = true
  ) => {
    const isFocused = activeTarget === targetName;
    return (
      <div
        onClick={() => setActiveTarget(targetName)}
        className={`p-3 rounded-2xl transition-all cursor-pointer ${
          isFocused
            ? 'bg-slate-900 border-2 border-cyan-400 shadow-lg shadow-cyan-500/10'
            : 'bg-slate-950/70 border border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            {label} {isRequired && <span className="text-cyan-400">*</span>}
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {value.length}/6 digits
          </span>
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const hasChar = value.length > index;
            const isCurrent = isFocused && value.length === index;
            return (
              <div
                key={index}
                className={`w-9 h-11 sm:w-11 sm:h-12 rounded-xl flex items-center justify-center font-mono text-lg font-bold transition-all ${
                  isCurrent
                    ? 'border-2 border-cyan-400 bg-cyan-950/40 text-cyan-300 ring-2 ring-cyan-500/30'
                    : hasChar
                    ? 'border border-cyan-500/50 bg-slate-900 text-white shadow-inner'
                    : 'border border-slate-800 bg-slate-950 text-slate-600'
                }`}
              >
                {hasChar ? (
                  showPinText ? (
                    value[index]
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  )
                ) : (
                  <span className="text-slate-700 text-xs">•</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900/98 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 my-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-indigo-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {isVerify
                      ? 'Verify Transaction Password'
                      : isChange
                      ? 'Change Transaction Password'
                      : 'Set Transaction Password'}
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-700/60 text-cyan-300">
                    Security
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isSetup
                    ? 'Required: Establish your 6-digit transaction PIN after registering'
                    : 'Protects wallet withdrawals and server lease authorizations'}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={closeTransactionPasswordModal}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Registration Notice Card */}
          {isSetup && (
            <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-indigo-950/70 border border-cyan-500/30 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Account Registered Successfully!</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Welcome, <strong className="text-white">{currentUser?.fullName}</strong>! Before you can execute cash withdrawals or lease servers, please establish your personal <strong>6-digit numeric Transaction Password</strong>.
              </p>
            </div>
          )}

          {/* Form Content */}
          <div className="mt-4 space-y-3.5">
            {/* If Change Mode: Enter Current PIN first */}
            {isChange && currentUser?.hasTransactionPassword && (
              <div>
                {renderPinCells(currentPin, 'current', 'Current 6-Digit PIN')}
              </div>
            )}

            {/* New 6-Digit PIN */}
            <div>
              {renderPinCells(
                pin,
                'pin',
                isVerify ? 'Enter 6-Digit PIN' : isChange ? 'New 6-Digit PIN' : 'Create 6-Digit PIN'
              )}
            </div>

            {/* Confirm 6-Digit PIN (if setup or change) */}
            {!isVerify && (
              <div>
                {renderPinCells(confirmPin, 'confirm', 'Confirm 6-Digit PIN')}
              </div>
            )}

            {/* Match Status / Visibility Toggle */}
            <div className="flex items-center justify-between text-xs px-1">
              <div>
                {!isVerify && pin.length === 6 && confirmPin.length === 6 && (
                  pin === confirmPin ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 6-Digit PINs Match
                    </span>
                  ) : (
                    <span className="text-rose-400 font-semibold flex items-center gap-1 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" /> PINs do not match
                    </span>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowPinText(!showPinText)}
                className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer text-[11px]"
              >
                {showPinText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPinText ? 'Hide Numbers' : 'Show Numbers'}</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* On-screen Numeric Keypad for Mobile and Touch Friendliness */}
            <div className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-2.5 shadow-inner">
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleDigitPress(digit)}
                    className="h-10 sm:h-11 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-cyan-950/60 border border-slate-800 hover:border-slate-700 text-white font-mono text-base font-bold transition-all shadow-sm flex items-center justify-center cursor-pointer select-none"
                  >
                    {digit}
                  </button>
                ))}

                {/* Clear / Reset */}
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="h-10 sm:h-11 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer select-none"
                  title="Clear all digits"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>

                {/* Digit 0 */}
                <button
                  type="button"
                  onClick={() => handleDigitPress('0')}
                  className="h-10 sm:h-11 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-cyan-950/60 border border-slate-800 hover:border-slate-700 text-white font-mono text-base font-bold transition-all shadow-sm flex items-center justify-center cursor-pointer select-none"
                >
                  0
                </button>

                {/* Backspace */}
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-10 sm:h-11 rounded-xl bg-slate-900/60 hover:bg-slate-800 active:bg-rose-950/60 text-slate-300 hover:text-rose-400 border border-slate-800 transition-all flex items-center justify-center cursor-pointer select-none"
                  title="Delete last digit"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={
                  isSubmitting ||
                  pin.length !== 6 ||
                  (!isVerify && confirmPin.length !== 6) ||
                  (!isVerify && pin !== confirmPin)
                }
                className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold py-3 rounded-2xl shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {isSubmitting ? (
                  <span>Securing Credentials...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      {isVerify
                        ? 'Confirm & Authorize'
                        : isChange
                        ? 'Update Transaction Password'
                        : 'Set Transaction Password'}
                    </span>
                  </>
                )}
              </button>

              {isSetup ? (
                <button
                  type="button"
                  onClick={closeTransactionPasswordModal}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-200 py-1.5 transition-colors cursor-pointer"
                >
                  I'll set this later (Withdrawals and leasing will remain locked)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={closeTransactionPasswordModal}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-200 py-1.5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
