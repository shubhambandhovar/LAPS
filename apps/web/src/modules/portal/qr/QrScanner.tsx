import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ScanLine, CheckCircle2, XCircle, User, Loader2 } from 'lucide-react';
import { useVerifyQr } from '../../../api/qr';
import { motion, AnimatePresence } from 'framer-motion';

export const QrScanner: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [lastResult, setLastResult] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { mutateAsync: verifyQr, isPending } = useVerifyQr();

  // Focus input automatically to catch physical hardware barcode scanners
  useEffect(() => {
    inputRef.current?.focus();
    const handleGlobalClick = () => inputRef.current?.focus();
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    try {
      const result = await verifyQr({
        secureToken: tokenInput.trim(),
        action: 'MANUAL_SCAN',
        deviceInfo: navigator.userAgent,
      });
      setLastResult({ success: true, data: result });
    } catch (error: any) {
      setLastResult({ success: false, message: error.response?.data?.message || 'Invalid QR Code' });
    } finally {
      setTokenInput('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <div className="inline-block p-4 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 rounded-full mb-4">
          <ScanLine className="w-8 h-8 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Universal QR Scanner</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Point your physical USB scanner at a code, or paste a secure token below.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleScan} className="flex gap-3 relative">
          <input
            ref={inputRef}
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Awaiting scan input..."
            className="flex-1 p-4 bg-slate-50 dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-900 focus:border-indigo-500 rounded-xl outline-none transition-colors text-center font-mono text-lg"
            autoFocus
            disabled={isPending}
            autoComplete="off"
          />
          <Button type="submit" size="lg" disabled={isPending || !tokenInput.trim()}>
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Process'}
          </Button>
        </form>
      </Card>

      <div className="h-64">
        <AnimatePresence mode="wait">
          {lastResult && (
            <motion.div
              key={lastResult.success ? 'success' : 'error'}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="h-full"
            >
              <Card className={`p-8 h-full flex flex-col items-center justify-center text-center border-2 ${lastResult.success ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                {lastResult.success ? (
                  <>
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                    <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">
                      {lastResult.data.message}
                    </h2>
                    <div className="text-emerald-600 dark:text-emerald-300">
                      Resolved Entity: {lastResult.data.qrType}
                    </div>
                    {/* If it's a student, show some minimal info */}
                    {lastResult.data.entity?.firstName && (
                      <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-full">
                          <User className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {lastResult.data.entity.firstName} {lastResult.data.entity.lastName}
                          </div>
                          <div className="text-sm text-slate-500">
                            {lastResult.data.entity.admissionNumber || lastResult.data.entity.employeeId}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <XCircle className="w-16 h-16 text-red-500 mb-4" />
                    <h2 className="text-xl font-bold text-red-700 dark:text-red-400">
                      Scan Rejected
                    </h2>
                    <p className="text-red-600 dark:text-red-300 mt-2">
                      {lastResult.message}
                    </p>
                  </>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
