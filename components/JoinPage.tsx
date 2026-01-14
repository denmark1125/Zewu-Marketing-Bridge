'use client';

import React, { useEffect, useState, useRef } from 'react';
import { db, doc, setDoc, serverTimestamp } from '../services/firebase';
import { ZewuBrandLogo } from './Logo';
import { Loader2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

// 強健的環境變數讀取工具
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
  const isProcessing = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('src') || params.get('source') || 'social_bio';
    const ua = navigator.userAgent || navigator.vendor;
    
    const isInstagram = /Instagram/i.test(ua);
    const isFB = /FBAN|FBAV/i.test(ua);
    const isSocialApp = isInstagram || isFB;

    // 檢查是否為回傳 Callback (網址帶有 token)
    const isCallback = window.location.hash.includes('access_token') || window.location.hash.includes('id_token');

    // 如果在 IG 內且不是 Callback 狀態，顯示引導按鈕
    if (isSocialApp && !isCallback) {
      setStatus('in_social_app');
      return;
    }

    const startBridge = async () => {
      if (isProcessing.current) return;
      isProcessing.current = true;
      setStatus('processing');

      try {
        // 檢查關鍵設定是否存在
        if (!MY_LIFF_ID) {
          throw new Error("Missing VITE_LIFF_ID environment variable");
        }

        if (!window.liff) {
          throw new Error("LIFF SDK not loaded");
        }

        await window.liff.init({ liffId: MY_LIFF_ID });

        if (!window.liff.isLoggedIn()) {
          window.liff.login({ redirectUri: window.location.href });
          return;
        }

        const idToken = window.liff.getDecodedIDToken();
        const profile = idToken ? {
          userId: idToken.sub,
          displayName: idToken.name || 'LINE User',
          pictureUrl: idToken.picture || ''
        } : await window.liff.getProfile();

        if (db) {
          try {
            const userSourceRef = doc(db, "user_sources", profile.userId);
            await setDoc(userSourceRef, {
              userId: profile.userId,
              displayName: profile.displayName,
              source: source,
              pictureUrl: profile.pictureUrl,
              createdAt: serverTimestamp(),
              lastSeen: Date.now(),
              platform: 'LIFF_BRIDGE',
              ua: ua
            }, { merge: true });
          } catch (e) {
            console.warn("Analytics record failed, but proceeding to redirect...");
          }
        }

        // 成功後跳轉
        window.location.replace(LINE_OA_URL);

      } catch (err: any) {
        console.error('Bridge Error:', err);
        setErrorMsg(err.message || "Unknown Error");
        setStatus('manual');
      }
    };

    if (!isSocialApp || isCallback) {
      startBridge();
    }
  }, []);

  if (status === 'in_social_app') {
    const liffJumpUrl = `https://liff.line.me/${MY_LIFF_ID}${window.location.search}`;
    
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-between p-10 z-[9999]">
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
          <div className="w-32 h-32 mb-12 animate-float">
            <ZewuBrandLogo color="#1a1a1a" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] mb-3 tracking-wider">歡迎來到澤物設計</h1>
          <p className="text-sm text-gray-500 mb-12 tracking-wide text-center leading-relaxed">
            即將為您開啟官方 LINE 諮詢服務<br/>
            點擊下方按鈕立即啟動
          </p>
          <a 
            href={liffJumpUrl}
            className="w-full bg-[#1a1a1a] text-white py-5 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg shadow-xl shadow-black/10 transition-all active:scale-[0.98]"
          >
            開啟 LINE 諮詢 <ArrowRight size={20} />
          </a>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-[0.3em] pb-4">
          <ShieldCheck size={12} />
          Verified & Secure Bridge
        </div>
        <style>{`
          @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
          .animate-float { animation: float 4s ease-in-out infinite; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#fcfcfc] p-8 overflow-hidden">
      <div className="w-full max-w-[300px] flex flex-col items-center">
        <div className="relative mb-12">
          <div className="w-48 h-64 flex items-center justify-center relative">
            <ZewuBrandLogo className="w-full h-full" color="#1a1a1a" />
            {status === 'processing' && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-16 h-[2px] bg-gray-100 overflow-hidden">
                <div className="h-full bg-black animate-progress-line"></div>
              </div>
            )}
          </div>
        </div>
        <div className="text-center h-20">
          {status === 'processing' ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-3 h-3 text-black animate-spin" />
                <span className="text-[10px] text-black font-medium tracking-[0.5em] uppercase">Connecting</span>
              </div>
            </div>
          ) : status === 'manual' ? (
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-[10px] text-red-500 font-medium uppercase tracking-widest">{errorMsg || "連線異常"}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 px-8 py-2 border border-black rounded-full text-[10px] font-bold uppercase tracking-widest"
              >
                Retry
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <style>{`
        @keyframes progress-line { 0% { transform: translateX(-100%); } 50% { transform: translateX(0); } 100% { transform: translateX(100%); } }
        .animate-progress-line { animation: progress-line 1.5s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default JoinPage;