
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { db, doc, setDoc, serverTimestamp } from '../services/firebase';
import { ZewuBrandLogo } from './Logo';
import { Loader2, MessageCircle, ExternalLink } from 'lucide-react';

const metaEnv = (import.meta as any).env || {};
const MY_LIFF_ID = metaEnv.VITE_LIFF_ID || "";
const LINE_OA_URL = metaEnv.VITE_LINE_OA_URL || "";
const PLATFORM_VERSION = "ZEWU_MODULAR_V10_PRO";

const JoinPage: React.FC = () => {
  const [status, setStatus] = useState<'detecting' | 'redirecting' | 'error' | 'manual'>('detecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('src') || params.get('source') || 'instagram_bio';
    
    // 1. 偵測是否在 Instagram 或 Facebook 內
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isSocialIAB = /Instagram|FBAN|FBAV/i.test(ua);

    // 如果在 IG 內，且還沒跳轉過，優先嘗試使用 Universal Link 喚起 LINE
    if (isSocialIAB && !window.location.hash.includes('access_token')) {
      setStatus('redirecting');
      // 使用 liff.line.me 網址是最穩定的喚起方式
      const liffUrl = `https://liff.line.me/${MY_LIFF_ID}?src=${source}`;
      window.location.href = liffUrl;
      
      // 設定一個安全計時器，如果 3 秒後還在原地，顯示手動按鈕
      setTimeout(() => setStatus('manual'), 3000);
      return;
    }

    // 2. 正常 LIFF 初始化流程
    const secureBridge = async () => {
      if (isProcessing.current) return;
      isProcessing.current = true;

      try {
        const liff = window.liff;
        if (!liff) throw new Error('LINE SDK Load Failed');

        await liff.init({ liffId: MY_LIFF_ID });

        // 如果在外部瀏覽器且未登入
        if (!liff.isLoggedIn()) {
          // 使用替代方案：引導至 LINE App 內開啟，避開網頁輸入密碼
          if (isSocialIAB) {
            liff.login();
          } else {
            liff.login({ redirectUri: window.location.href });
          }
          return;
        }

        // 成功取得資料
        const idToken = liff.getDecodedIDToken();
        const profile = idToken ? {
          userId: idToken.sub,
          displayName: idToken.name || 'LINE User',
          pictureUrl: idToken.picture || ''
        } : await liff.getProfile();

        // 紀錄進 Firebase
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

        // 最後跳轉至 LINE 官方帳號
        setStatus('redirecting');
        window.location.replace(LINE_OA_URL);

      } catch (err: any) {
        console.error('Bridge Error:', err);
        setErrorMessage('請點擊下方按鈕開啟 LINE');
        setStatus('manual');
      }
    };

    secureBridge();
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#fafafa] p-8 overflow-hidden">
      {/* 核心 Logo 動畫區 */}
      <div className="w-full max-w-[300px] flex flex-col items-center animate-fade-in">
        <div className="relative mb-12">
          <div className="w-48 h-64 flex items-center justify-center relative">
            <ZewuBrandLogo className={`w-full h-full transition-opacity duration-700 ${status === 'error' ? 'opacity-20' : 'opacity-100'}`} color="#333333" />
            
            {/* 掃描動效 */}
            {status !== 'manual' && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-24 h-[1px] bg-[#eeeeee] overflow-hidden">
                <div className="h-full bg-[#333333] animate-scan-line"></div>
              </div>
            )}
          </div>
        </div>

        {/* 狀態文字 */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            {status === 'redirecting' || status === 'detecting' ? (
              <>
                <Loader2 className="w-3 h-3 text-[#333] animate-spin" />
                <span className="text-[10px] text-[#333] font-light tracking-[0.4em] uppercase">Redirecting to LINE</span>
              </>
            ) : status === 'manual' ? (
              <span className="text-[10px] text-red-800/60 font-medium tracking-[0.2em]">{errorMessage || '無法自動跳轉？'}</span>
            ) : null}
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="mt-12 w-full flex flex-col gap-4 items-center">
          {status === 'manual' ? (
            <button 
              onClick={() => window.location.href = `https://liff.line.me/${MY_LIFF_ID}`}
              className="flex items-center gap-3 px-8 py-4 bg-[#06C755] text-white rounded-full font-bold text-sm shadow-lg shadow-[#06C755]/20 hover:scale-105 active:scale-95 transition-all"
            >
              <MessageCircle size={18} fill="white" />
              立即開啟 LINE 諮詢
            </button>
          ) : (
            <p className="text-[9px] text-gray-300 font-light tracking-widest uppercase">Secured by Zewu Design</p>
          )}

          {status === 'manual' && (
            <button 
              onClick={() => window.location.href = LINE_OA_URL}
              className="text-[10px] text-gray-400 underline underline-offset-4 font-light tracking-tight"
            >
              直接前往官方帳號 (不紀錄來源)
            </button>
          )}
        </div>
      </div>

      {/* 底部裝飾 */}
      <div className="absolute bottom-12 flex flex-col items-center gap-4 opacity-10">
        <div className="w-[1px] h-12 bg-[#333333]"></div>
        <span className="text-[8px] font-bold tracking-[0.6em] uppercase text-[#333333]">Interior Architecture</span>
      </div>

      <style>{`
        @keyframes scan-line { 0% { transform: translateX(-100%); } 50% { transform: translateX(0); } 100% { transform: translateX(100%); } }
        .animate-scan-line { animation: scan-line 2s infinite ease-in-out; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
      `}</style>
    </div>
  );
};

export default JoinPage;
