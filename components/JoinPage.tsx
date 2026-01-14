
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { db, doc, setDoc, serverTimestamp } from '../services/firebase';
import { ZewuBrandLogo } from './Logo';
import { Loader2, MessageCircle, MoreVertical, ExternalLink, AlertCircle } from 'lucide-react';

const metaEnv = (import.meta as any).env || {};
const MY_LIFF_ID = metaEnv.VITE_LIFF_ID || "";
const LINE_OA_URL = metaEnv.VITE_LINE_OA_URL || "";
const PLATFORM_VERSION = "ZEWU_MODULAR_V11_FINAL";

const JoinPage: React.FC = () => {
  const [status, setStatus] = useState<'detecting' | 'redirecting' | 'in_jail' | 'manual'>('detecting');
  const [debugInfo, setDebugInfo] = useState<string>("");
  const isProcessing = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('src') || params.get('source') || 'social_bio';
    
    // 1. 偵測環境
    const ua = navigator.userAgent || navigator.vendor;
    const isSocialIAB = /Instagram|FBAN|FBAV/i.test(ua);
    const isLineIAB = /Line/i.test(ua);

    // 如果在 IG/FB 內，且還沒有 Token (表示剛進來)
    // 這是最關鍵的一步：提示用戶離開 IG
    if (isSocialIAB && !window.location.hash.includes('access_token')) {
      setStatus('in_jail');
      return;
    }

    const initLiff = async () => {
      if (isProcessing.current) return;
      isProcessing.current = true;

      try {
        const liff = window.liff;
        if (!liff) {
          setStatus('manual');
          return;
        }

        await liff.init({ liffId: MY_LIFF_ID });

        if (!liff.isLoggedIn()) {
          // 如果在外部瀏覽器但未登入，嘗試登入
          liff.login({ redirectUri: window.location.href });
          return;
        }

        // 成功登入，獲取資料
        const idToken = liff.getDecodedIDToken();
        const profile = idToken ? {
          userId: idToken.sub,
          displayName: idToken.name || 'LINE User',
          pictureUrl: idToken.picture || ''
        } : await liff.getProfile();

        // 寫入 Firebase
        const userSourceRef = doc(db, "user_sources", profile.userId);
        await setDoc(userSourceRef, {
          userId: profile.userId,
          displayName: profile.displayName,
          source: source,
          pictureUrl: profile.pictureUrl,
          platform: PLATFORM_VERSION,
          createdAt: serverTimestamp(),
          lastSeen: Date.now()
        }, { merge: true });

        // 跳轉
        setStatus('redirecting');
        window.location.replace(LINE_OA_URL);

      } catch (err: any) {
        console.error('LIFF Init Error:', err);
        setDebugInfo(err.message || "Init Failed");
        setStatus('manual');
      }
    };

    initLiff();
  }, []);

  // 引導畫面：當用戶在 IG 監獄時顯示
  if (status === 'in_jail') {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-start p-10 animate-fade-in">
        <div className="w-full flex justify-end mb-10 opacity-40">
          <div className="flex flex-col items-center gap-1">
            <MoreVertical size={24} />
            <span className="text-[10px] font-bold">點擊右上角</span>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-32 h-32 mb-8 opacity-20">
            <ZewuBrandLogo color="#333" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 tracking-tight">請在外部瀏覽器開啟</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-8 px-4">
            Instagram 限制了 App 跳轉功能。<br/>請點擊右上角「<MoreVertical className="inline h-4" />」並選擇<br/>
            <span className="text-blue-600 font-bold">「在瀏覽器中開啟」</span><br/>即可快速加入官方 LINE。
          </p>
          
          <button 
            onClick={() => window.location.href = `https://liff.line.me/${MY_LIFF_ID}`}
            className="flex items-center gap-2 px-8 py-4 bg-[#06C755] text-white rounded-full font-bold shadow-lg"
          >
            <ExternalLink size={18} />
            嘗試直接開啟 LINE
          </button>
        </div>
        
        <div className="mt-auto pb-10">
           <p className="text-[10px] text-gray-300 tracking-[0.3em] uppercase">Zewu Design Optimization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#fafafa] p-8 overflow-hidden">
      <div className="w-full max-w-[300px] flex flex-col items-center animate-fade-in">
        <div className="relative mb-12">
          <div className="w-48 h-64 flex items-center justify-center relative">
            <ZewuBrandLogo className="w-full h-full" color="#333333" />
            {status !== 'manual' && (
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
              <span className="text-[10px] text-[#333] font-light tracking-[0.4em] uppercase">Processing...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <div className="p-3 bg-red-50 rounded-full">
                 <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-xs text-gray-400 font-light leading-loose">
                自動跳轉受限，請點擊下方按鈕<br/>或檢查網路連線
              </p>
              <button 
                onClick={() => window.location.href = `https://liff.line.me/${MY_LIFF_ID}`}
                className="px-10 py-4 bg-[#333] text-white rounded-full text-xs font-bold tracking-widest hover:bg-black transition-all"
              >
                手動開啟 LINE
              </button>
              <button 
                onClick={() => window.location.href = LINE_OA_URL}
                className="text-[10px] text-gray-400 underline underline-offset-4"
              >
                略過紀錄，直接前往
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
