'use client';

import React, { useEffect, useState, useRef } from 'react';
import { db, doc, setDoc, serverTimestamp } from '../services/firebase';
import { ZewuBrandLogo } from './Logo';
import { 
  Loader2, 
  ArrowRight, 
  Copy, 
  CheckCircle2, 
  MoreHorizontal, 
  Compass, 
  MessageSquare, 
  ShieldCheck,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

const getEnv = (key: string): string => {
  const metaEnv = (import.meta as any).env;
  if (metaEnv && metaEnv[key]) return metaEnv[key];
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key] as string;
  return "";
};

const MY_LIFF_ID = getEnv("VITE_LIFF_ID");
const LINE_OA_URL = getEnv("VITE_LINE_OA_URL");
const LINE_SEARCH_ID = "@zewu"; 

const JoinPage: React.FC = () => {
  const [status, setStatus] = useState<'detecting' | 'in_social_app' | 'processing' | 'manual'>('detecting');
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isOpening, setIsOpening] = useState(false);
  const [copied, setCopied] = useState(false);
  const isProcessing = useRef(false);

  // 取得最佳跳轉連結 (針對不同 OS 繞過 IAB)
  const getDeepLink = () => {
    const ua = navigator.userAgent.toLowerCase();
    const liffUrl = `https://liff.line.me/${MY_LIFF_ID}${window.location.search}`;
    
    // Android 專用 Intent (最強力繞過方式)
    if (/android/.test(ua)) {
      return `intent://liff.line.me/${MY_LIFF_ID}${window.location.search}#Intent;scheme=https;package=jp.naver.line.android;S.browser_fallback_url=${encodeURIComponent(liffUrl)};end`;
    }
    
    // iOS 優先嘗試直接 Scheme
    if (/iphone|ipad|ipod/.test(ua)) {
      return `line://app/${MY_LIFF_ID}${window.location.search}`;
    }

    return liffUrl;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('src') || params.get('source') || 'social_bio';
    const ua = navigator.userAgent || navigator.vendor;
    
    const isInstagram = /Instagram/i.test(ua);
    const isFB = /FBAN|FBAV/i.test(ua);
    const isSocialApp = isInstagram || isFB;

    const isLiffCallback = window.location.hash.includes('access_token') || 
                          window.location.hash.includes('id_token') || 
                          params.has('liff.state') || 
                          ua.includes('Line/');

    if (isSocialApp && !isLiffCallback) {
      setStatus('in_social_app');
      
      // 在社交軟體內，延遲 500ms 嘗試自動跳轉一次 (對部分 Android 有效)
      const timer = setTimeout(() => {
        const link = getDeepLink();
        window.location.href = link;
      }, 800);
      
      return () => clearTimeout(timer);
    }

    const startBridge = async () => {
      if (isProcessing.current) return;
      isProcessing.current = true;
      setStatus('processing');

      try {
        if (!MY_LIFF_ID || !window.liff) throw new Error("Connection failed");
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
          }, { merge: true }).catch(() => {});
        }

        window.location.replace(LINE_OA_URL);
      } catch (err: any) {
        setErrorMsg(err.message || "Retry needed");
        setStatus('manual');
      }
    };

    startBridge();
  }, []);

  const handleManualJump = () => {
    if (isOpening) return;
    setIsOpening(true);
    window.location.href = getDeepLink();
    setTimeout(() => setIsOpening(false), 3000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(LINE_SEARCH_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'in_social_app') {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center z-[9999] overflow-y-auto">
        {/* 頂部引導：根據設備顯示不同提示 */}
        <div className="w-full bg-black text-white py-3 px-6 flex items-center justify-between text-[10px] font-bold tracking-[0.2em] uppercase">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-yellow-400" />
            點擊右上角「...」選擇外部瀏覽器開啟
          </div>
          <ExternalLink size={14} />
        </div>

        <div className="flex-1 w-full max-w-sm flex flex-col items-center justify-center p-10">
          <div className="w-20 h-28 mb-12">
            <ZewuBrandLogo color="#1a1a1a" />
          </div>
          
          <div className="space-y-2 text-center mb-10">
            <h1 className="text-xl font-bold text-[#1a1a1a] tracking-[0.2em]">澤物設計</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.4em]">ZEWU INTERIOR DESIGN</p>
          </div>

          <div className="w-full space-y-4">
            <button 
              onClick={handleManualJump}
              disabled={isOpening}
              className="group relative w-full bg-[#1a1a1a] text-white py-5 rounded-xl flex items-center justify-center gap-3 font-bold text-base shadow-2xl active:scale-[0.98] transition-all"
            >
              {isOpening ? <Loader2 className="animate-spin" size={20} /> : <>立即開啟 LINE 諮詢 <ArrowRight size={18} /></>}
            </button>
            
            <p className="text-center text-[10px] text-gray-400 font-medium italic">
              * 若點擊後無反應，請參考上方提示開啟瀏覽器
            </p>
          </div>
          
          <div className="w-full flex items-center gap-4 my-12">
            <div className="flex-1 h-[1px] bg-gray-100"></div>
            <span className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.3em]">手動搜尋備案</span>
            <div className="flex-1 h-[1px] bg-gray-100"></div>
          </div>

          {/* 手動複製 ID 區塊 - 強化 @zewu 呼籲 */}
          <div className="w-full bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest text-center mb-5">
              官方 LINE 諮詢 ID
            </p>
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-4 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-300 font-bold uppercase tracking-tighter">Line ID</span>
                <span className="font-mono font-black text-lg text-slate-800 tracking-tight">{LINE_SEARCH_ID}</span>
              </div>
              <button 
                onClick={handleCopyId}
                className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-lg transition-all ${copied ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-black'}`}
              >
                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                {copied ? "已複製" : "點擊複製"}
              </button>
            </div>
            <div className="mt-5 flex items-start gap-2 text-slate-400">
              <MessageSquare size={12} className="mt-0.5 shrink-0" />
              <p className="text-[10px] leading-relaxed">
                複製 ID 後，請至 LINE 的「加入好友」頁面貼上搜尋並加入諮詢。
              </p>
            </div>
          </div>
        </div>

        <div className="pb-10 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-[9px] text-gray-300 uppercase tracking-[0.3em] font-medium">
            <ShieldCheck size={10} />
            Direct Encryption Link
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white">
      <div className="w-24 h-32 mb-8 opacity-10">
        <ZewuBrandLogo color="#1a1a1a" />
      </div>
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-8 h-8">
           <div className="absolute inset-0 border-2 border-gray-100 rounded-full"></div>
           <div className="absolute inset-0 border-2 border-black rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] text-gray-400 tracking-[0.6em] uppercase font-bold">Secure Redirecting</span>
          <span className="text-[8px] text-gray-200 tracking-[0.2em] font-medium uppercase">Please hold on</span>
        </div>
      </div>
      
      {status === 'manual' && (
        <div className="mt-12 flex flex-col items-center gap-4">
           <p className="text-[10px] text-red-400 tracking-[0.2em] font-bold uppercase">{errorMsg}</p>
           <button onClick={() => window.location.reload()} className="text-[10px] font-bold border-b-2 border-black pb-1 tracking-[0.2em]">RETRY CONNECTION</button>
        </div>
      )}
    </div>
  );
};

export default JoinPage;