
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { db, doc, setDoc, serverTimestamp } from '../services/firebase';
import { Loader2, ShieldCheck } from 'lucide-react';

const metaEnv = (import.meta as any).env || {};
const MY_LIFF_ID = metaEnv.VITE_LIFF_ID || "";
const LINE_OA_URL = metaEnv.VITE_LINE_OA_URL || "";
const PLATFORM_VERSION = "ZEWU_SECURE_V6";

const ZewuIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 150" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="5" y="5" width="90" height="140" stroke="currentColor" strokeWidth="4" rx="2" />
    <path d="M 5 95 C 35 85, 65 105, 95 95" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 5 115 C 35 105, 65 125, 95 115" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 5 135 C 35 125, 65 145, 95 135" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const JoinPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    if (!MY_LIFF_ID || !LINE_OA_URL) {
      setError('Config Error');
      return;
    }

    const secureBridge = async () => {
      if (isProcessing.current) return;
      isProcessing.current = true;

      try {
        const liff = window.liff;
        if (!liff) throw new Error('No SDK');

        // 1. 初始化 LIFF
        await liff.init({ liffId: MY_LIFF_ID });

        // 2. 檢查登入
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        // 3. 獲取數據 (優先解碼 Token)
        const idToken = liff.getDecodedIDToken();
        const profile = idToken ? {
          userId: idToken.sub,
          displayName: idToken.name || 'LINE User',
          pictureUrl: idToken.picture || ''
        } : await liff.getProfile();

        // 4. 解析來源
        const params = new URLSearchParams(window.location.search);
        const source = params.get('src') || params.get('source') || 'direct';

        // 5. 執行寫入並等待完成 (確保數據一筆都不掉)
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

        // 6. 確認寫入成功後才執行跳轉
        window.location.replace(LINE_OA_URL);

      } catch (err: any) {
        console.error('Secure Bridge Error:', err);
        // 若發生非預期錯誤，顯示錯誤按鈕供手動跳轉，避免完全卡死
        setError('系統處理中，請稍候或手動加入');
      }
    };

    secureBridge();
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white p-8 overflow-hidden">
      <div className="relative">
        <div className="w-20 h-20 bg-slate-50 rounded-[30px] flex items-center justify-center relative overflow-hidden">
          <ZewuIcon className="w-10 h-10 text-[#54534d] z-10" />
          <div className="absolute inset-0 border-2 border-[#54534d] border-t-transparent rounded-[30px] animate-spin opacity-40"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/50 to-white/0 animate-shimmer"></div>
        </div>
      </div>
      
      <div className="mt-8 space-y-4 text-center">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-800 tracking-wider">澤物設計</h1>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Connecting to LINE...</p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-3 h-3 text-[#54534d] animate-spin" />
          <span className="text-[10px] text-slate-500 font-medium italic">
            {error ? '資料處理中' : '安全驗證中'}
          </span>
        </div>
      </div>

      {(error || true) && (
        <button 
          onClick={() => window.location.href = LINE_OA_URL}
          className={`mt-10 px-6 py-3 bg-[#06C755] text-white rounded-xl font-bold text-sm shadow-lg transition-opacity duration-500 ${error ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          立即進入官方帳號
        </button>
      )}

      <div className="absolute bottom-10 flex items-center gap-2 opacity-30">
        <ShieldCheck className="w-3 h-3" />
        <span className="text-[8px] font-bold tracking-widest uppercase">Verified & Secure Bridge</span>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%) rotate(45deg); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default JoinPage;
