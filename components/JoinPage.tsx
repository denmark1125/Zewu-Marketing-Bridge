
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { db, doc, setDoc, serverTimestamp } from '../services/firebase';
import { ZewuBrandLogo } from './Logo';
import { Loader2, MessageCircle, MoreVertical, Copy, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';

const metaEnv = (import.meta as any).env || {};
const MY_LIFF_ID = metaEnv.VITE_LIFF_ID || "";
const LINE_OA_URL = metaEnv.VITE_LINE_OA_URL || "";

const JoinPage: React.FC = () => {
  const [status, setStatus] = useState<'detecting' | 'redirecting' | 'in_jail' | 'manual'>('detecting');
  const [copied, setCopied] = useState(false);
  const isProcessing = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('src') || params.get('source') || 'social_bio';
    
    // 偵測環境
    const ua = navigator.userAgent || navigator.vendor;
    const isInstagram = /Instagram/i.test(ua);
    const isFB = /FBAN|FBAV/i.test(ua);
    const isSocialIAB = isInstagram || isFB;

    // 如果在 IG 內，且還沒有 Token，強制顯示引導頁，絕對不跑 LIFF 初始化
    if (isSocialIAB && !window.location.hash.includes('access_token')) {
      setStatus('in_jail');
      return;
    }

    const startBridge = async () => {
      if (isProcessing.current) return;
      isProcessing.current = true;

      try {
        if (!window.liff) {
          setStatus('manual');
          return;
        }

        await window.liff.init({ liffId: MY_LIFF_ID });

        if (!window.liff.isLoggedIn()) {
          // 在正常瀏覽器中，觸發登入
          window.liff.login({ redirectUri: window.location.href });
          return;
        }

        const idToken = window.liff.getDecodedIDToken();
        const profile = idToken ? {
          userId: idToken.sub,
          displayName: idToken.name || 'LINE User',
          pictureUrl: idToken.picture || ''
        } : await window.liff.getProfile();

        // 紀錄進 Firebase
        const userSourceRef = doc(db, "user_sources", profile.userId);
        await setDoc(userSourceRef, {
          userId: profile.userId,
          displayName: profile.displayName,
          source: source,
          pictureUrl: profile.pictureUrl,
          createdAt: serverTimestamp(),
          lastSeen: Date.now(),
          ua: ua
        }, { merge: true });

        // 成功跳轉
        setStatus('redirecting');
        window.location.replace(LINE_OA_URL);

      } catch (err) {
        console.error('Bridge Error:', err);
        setStatus('manual');
      }
    };

    startBridge();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Instagram 專屬引導畫面 (不讓他有機會點登入)
  if (status === 'in_jail') {
    return (
      <div className="fixed inset-0 bg-[#0f0f0f] text-white flex flex-col p-8 z-[9999]">
        {/* 右上角指引動畫 */}
        <div className="absolute top-4 right-4 flex flex-col items-end animate-bounce">
          <div className="flex items-center gap-2 text-yellow-400 font-bold mb-1">
             <span className="text-sm">點擊右上角三點</span>
             <ArrowUpRight size={20} />
          </div>
          <div className="p-2 bg-white/10 rounded-full">
            <MoreVertical size={24} />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center mt-12">
          <div className="w-24 h-24 mb-10 opacity-40">
            <ZewuBrandLogo color="white" />
          </div>
          
          <h2 className="text-xl font-bold mb-6 tracking-tight">請使用外部瀏覽器開啟</h2>
          
          <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10 w-full max-w-sm">
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Instagram 會限制 App 跳轉功能。<br/>
              請選擇 <span className="text-white font-bold">「在瀏覽器中開啟」</span><br/>
              即可立即喚起 LINE 加入好友。
            </p>
            
            <button 
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white/10 text-white border border-white/20'}`}
            >
              {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              {copied ? '已複製連結' : '複製連結手動開啟'}
            </button>
          </div>

          <p className="text-[10px] text-gray-500 tracking-[0.4em] uppercase">Zewu Design Security Bridge</p>
        </div>
      </div>
    );
  }

  // 2. 正常初始化與跳轉畫面
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#fafafa] p-8 overflow-hidden">
      <div className="w-full max-w-[300px] flex flex-col items-center animate-fade-in">
        <div className="relative mb-12">
          <div className="w-48 h-64 flex items-center justify-center relative">
            <ZewuBrandLogo className="w-full h-full" color="#333333" />
            {(status === 'detecting' || status === 'redirecting') && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-24 h-[1px] bg-[#eeeeee] overflow-hidden">
                <div className="h-full bg-[#333333] animate-scan-line"></div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          {status === 'redirecting' || status === 'detecting' ? (
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-3 h-3 text-[#333] animate-spin" />
              <span className="text-[10px] text-[#333] font-light tracking-[0.4em] uppercase">Connecting to LINE...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <p className="text-xs text-gray-400 leading-loose">
                連線逾時或受限，請點擊下方重試
              </p>
              <button 
                onClick={() => window.location.href = `https://liff.line.me/${MY_LIFF_ID}`}
                className="px-10 py-4 bg-[#333] text-white rounded-full text-xs font-bold tracking-widest"
              >
                手動開啟 LINE
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scan-line { 0% { transform: translateX(-100%); } 50% { transform: translateX(0); } 100% { transform: translateX(100%); } }
        .animate-scan-line { animation: scan-line 2s infinite ease-in-out; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default JoinPage;
