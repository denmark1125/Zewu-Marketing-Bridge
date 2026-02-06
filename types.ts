
export interface LineConnection {
  UserId: string;          // LINE 唯一識別碼 (U...)
  lineUserId: string;      // 使用者顯示名稱 (如：施文喆)
  linePictureUrl: string;
  isBlocked: boolean;
  isBound: boolean;
  timestamp: any;
  source?: string;         // 行銷來源追蹤
  platform?: string;
}

// Global declaration for the LIFF SDK loaded via script tag
declare global {
  interface Window {
    liff: any;
  }
}
