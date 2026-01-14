
export interface UserSourceData {
  userId: string;
  displayName: string;
  lineUserId: string;
  source: string;
  pictureUrl: string;
  platform: 'LIFF';
  createdAt: any;
  lastSeen: number;
}

// Global declaration for the LIFF SDK loaded via script tag
declare global {
  interface Window {
    liff: any;
  }
}
