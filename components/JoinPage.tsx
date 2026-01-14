
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { db, doc, setDoc, serverTimestamp } from '../services/firebase';
import { Loader2, MessageCircle, ExternalLink, ShieldCheck } from 'lucide-react';

// 從環境變數讀取配置，若無則使用預設值
const MY_LIFF_ID = process.env.VITE_LIFF_ID || "2008826901-DGGr1P8u";
const LINE_OA_URL = process.env.VITE_LINE_OA_URL || "https://lin.ee/GRgdkQe";
const PLATFORM_VERSION = "ZEWU_LIFF_PRO_V4";

const ZewuIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 150" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="5" y="5" width="90" height="140" stroke="currentColor" strokeWidth="4" rx="2" />
    <path d="M 5 95 C 35 85, 65 105, 95 95" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 5 115 C 35 105, 65 125, 95 115" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 5 135 C 35 125, 65 145, 95 135" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const JoinPage: React.FC = () => {
  const [status, setStatus] = useState('正在初始化...');
  const [error, setError] = useState<string | null>(null);
  const [showManualBtn, setShowManualBtn] = useState(false);

  const handleManualRedirect = useCallback(() => {
    window.location.href = LINE_OA_URL;
  }, []);

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liff = window.liff;
        if (!liff) {
          throw new Error('LIFF SDK 載入失敗');
        }

        // 1. 捕捉行銷來源 (?src=)
        const params = new URLSearchParams(window.location.search);
        const source = params.get('src') || params.get('source') || sessionStorage.getItem('zewu_marketing_src') || 'direct';

        if (source !== 'direct') {
          sessionStorage.setItem('zewu_marketing_src', source);
        }

        setStatus('正在連接 LINE...');
        await liff.init({ liffId: MY_LIFF_ID });

        // 2. 登入檢查
        if (!liff.isLoggedIn()) {
          setStatus('正在導向登入...');
          liff.login({ redirectUri: window.location.href }); 
          return;
        }

        // 3. 獲取用戶資料
        setStatus('正在同步數據...');
        const profile = await liff.getProfile();

        // 4. 寫入資料庫
        // 依照截圖需求：文件ID為 userId，並包含 lineUserId 等欄位
        const userSourceRef = doc(db, "user_sources", profile.userId);
        await setDoc(userSourceRef, {
          userId: profile.userId,
          displayName: profile.displayName,
          lineUserId: profile.displayName, // 映射到截圖中的 lineUserId
          source: source,
          pictureUrl: profile.pictureUrl || '',
          platform: PLATFORM_VERSION,
          createdAt: serverTimestamp(),
          lastSeen: Date.now()
        }, { merge: true });

        // 清除暫存
        sessionStorage.removeItem('zewu_marketing_src');

        // 5. 自動跳轉
        setStatus('即將進入官方帳號...');
        window.location.replace(LINE_OA_URL);

        const timer = setTimeout(() => setShowManualBtn(true), 3500);
        return () => clearTimeout(timer);

      } catch (err: any) {
        console.error('LIFF/Firebase Error:', err);
        setError('系統處理中，請點擊下方按鈕加入');
        setShowManualBtn(true);
      }
    };

    initLiff();
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white p-8 text-center overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-100 via-[#54534d] to-slate-100 opacity-20"></div>
      
      <div className="relative mb-10 group">
        <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center relative transition-transform duration-500 group-hover:scale-110">
          <ZewuIcon className="w-12 h-12 text-[#54534d]" />
          <div className="absolute inset-[-8px] border-[2px] border-[#54534d] border-t-transparent rounded-[48px] animate-spin-slow opacity-10"></div>
          {!error && (
            <div className="absolute inset-0 border-4 border-[#54534d] border-t-transparent rounded-[40px] animate-spin opacity-20"></div>
          )}
        </div>
      </div>
      
      <div className="space-y-6 max-w-xs w-full">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">澤物設計</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em]">Zewu Interior Design</p>
        </div>
        
        <div className="flex flex-col items-center justify-center gap-3">
          {error ? (
            <div className="bg-red-50 px-4 py-2 rounded-full border border-red-100">
              <p className="text-red-500 font-bold text-xs">{error}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
              <Loader2 className="w-3 h-3 text-[#54534d] animate-spin" />
              <p className="text-[#54534d] font-bold text-[10px] tracking-[0.2em] uppercase">{status}</p>
            </div>
          )}
        </div>

        <div className={`transition-all duration-500 transform ${showManualBtn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <button 
            onClick={handleManualRedirect}
            className="group w-full bg-[#06C755] text-white py-4 px-6 rounded-2xl font-black text-sm shadow-xl active:scale-[0.97] transition-all flex items-center justify-center gap-3 animate-bounce-slow"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            點此加入 LINE 好友
            <ExternalLink className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50/50 rounded-full border border-slate-100/50">
          <ShieldCheck className="w-3 h-3 text-slate-300" />
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Official Service Bridge</span>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(-3%); } 50% { transform: translateY(0); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        .animate-bounce-slow { animation: bounce-slow 2s infinite; }
      `}</style>
    </div>
  );
};

export default JoinPage;
