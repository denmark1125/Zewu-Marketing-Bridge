'use client';

import React, { useEffect, useState, useRef } from 'react';
import { db, doc, setDoc, serverTimestamp } from '../services/firebase';
import { ZewuBrandLogo } from './Logo';
import { Loader2, ArrowRight, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';

const getEnv = (key: string): string => {
  const metaEnv = (import.meta as any).env;
  if (metaEnv && metaEnv[key]) return metaEnv[key];
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key] as string;
  return "";
};

const MY_LIFF_ID = getEnv("VITE_LIFF_ID");
const LINE_OA_URL = getEnv("VITE_LINE_OA_URL");

const JoinPage: React.FC = () => {
  const [status, setStatus] = useState<'detecting' | 'in_social_app' | 'processing' | 'manual'>('detecting');
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isOpening, setIsOpening] = useState(false);
  const isProcessing = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('src') || params.get('source') || 'social_bio';
    const ua = navigator.userAgent || navigator.vendor;
    
    const isInstagram = /Instagram/i.test(ua);
    const isFB = /FBAN|FBAV/i.test(ua);
    const isSocialApp = isInstagram || isFB;

    const isLiffContext = window.location.hash.includes('access_token') || 
                         window.location.hash.includes('id_token') || 
                         params.has('liff.state') || 
                         ua.includes('Line/');

    if (isSocialApp && !isLiffContext) {
      setStatus('in_social_app');
      return;
    }

    const startBridge = async () => {
      if (isProcessing.current) return;
      isProcessing.current = true;
      setStatus('processing');

      try {
        if (!MY_LIFF_ID) throw new Error("Config missing");
        if (!window.liff) throw new Error("SDK failed");

        await window.liff.init({ liffId: MY_LIFF_ID });

        if (!window.liff.isLoggedIn()) {
          window.liff.login({ redirectUri: window.location.href });
          return;
        }

        const profile = await window.liff.getProfile().catch(() => null);
        
        if (profile && db) {
          const userSourceRef = doc(db, "user_sources", profile.userId);
          setDoc(userSourceRef, {
            userId: profile.userId,
            displayName: profile.displayName,
            source: source,
            pictureUrl: profile.pictureUrl,
            createdAt: serverTimestamp(),
            lastSeen: Date.now(),
            platform: 'LIFF_BRIDGE',
            ua: ua
          }, { merge: true }).catch(e => console.warn("Log skip", e));
        }

        window.location.replace(LINE_OA_URL);

      } catch (err: any) {
        console.error('Bridge Error:', err);
        setErrorMsg(err.message || "Unknown Error");
        setStatus('manual');
      }
    };

    if (!isSocialApp || isLiffContext) {
      startBridge();
    }
  }, []);

  const handleManualJump = () => {
    if (isOpening) return;
    setIsOpening(true);
    const liffJumpUrl = `https://liff.line.me/${MY_LIFF_ID}${window.location.search}`;
    // 使用 window.location.href 在 IG 內跳轉通常比 <a> 標籤穩定
    window.location.href = liffJumpUrl;
  };

  if (status === 'in_social_app') {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-10 z-[9999]">
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="w-24 h-32 mb-10">
            <ZewuBrandLogo color="#1a1a1a" />
          </div>
          
          <div className="space-y-2 text-center mb-10">
            <h1 className="text-xl font-bold text-[#1a1a1a] tracking-[0.2em]">澤物設計</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.4em]">ZEWU INTERIOR DESIGN</p>
          </div>

          <p className="text-xs text-gray-500 mb-12 tracking-wider leading-relaxed text-center">
            即將為您開啟官方 LINE 諮詢服務<br/>
            點擊下方按鈕立即啟動
          </p>

          <button 
            onClick={handleManualJump}
            disabled={isOpening}
            className="group relative w-full overflow-hidden bg-[#1a1a1a] text-white py-5 rounded-xl flex items-center justify-center gap-3 font-bold text-base shadow-2xl transition-all active:scale-[0.97] touch-none"
            style={{ touchAction: 'manipulation' }}
          >
            {isOpening ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                開啟 LINE 諮詢 <ArrowRight size={18} />
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>
          
          <button 
            onClick={handleManualJump}
            className="mt-6 text-[10px] text-gray-400 flex items-center gap-1 border-b border-gray-200 pb-0.5"
          >
            按鈕無反應？點此重試 <ExternalLink size={10} />
          </button>

          <div className="mt-16 flex items-center gap-2 text-[9px] text-gray-300 uppercase tracking-[0.2em]">
            <ShieldCheck size={10} />
            Secure Encrypted Bridge
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white">
      <div className="w-32 h-40 mb-10 animate-pulse duration-1000">
        <ZewuBrandLogo color="#1a1a1a" />
      </div>
      
      <div className="h-6 flex items-center justify-center">
        {status === 'processing' || status === 'detecting' ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-[1px] bg-gray-100 relative overflow-hidden">
              <div className="absolute inset-0 bg-black animate-loading-bar"></div>
            </div>
            <span className="text-[9px] text-gray-300 tracking-[0.4em] uppercase ml-[0.4em]">Connecting</span>
          </div>
        ) : status === 'manual' ? (
          <div className="flex flex-col items-center gap-2 text-center px-6">
            <p className="text-[9px] text-red-400 tracking-widest uppercase">{errorMsg || "Connection Error"}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-[9px] font-bold border-b border-black pb-0.5 tracking-[0.2em] uppercase mt-2"
            >
              Retry
            </button>
          </div>
        ) : null}
      </div>
      
      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-loading-bar { animation: loading-bar 1s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default JoinPage;