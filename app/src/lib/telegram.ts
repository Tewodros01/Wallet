type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
};

type TelegramWebApp = {
  initData: string;
  initDataUnsafe?: {
    user?: TelegramUser;
    start_param?: string;
  };
  ready: () => void;
  expand: () => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export const getTelegramWebApp = () => window.Telegram?.WebApp ?? null;

export const isTelegramMiniApp = () => {
  const webApp = getTelegramWebApp();
  return Boolean(webApp?.initData);
};

export const getTelegramInitData = () => getTelegramWebApp()?.initData ?? "";

export const getTelegramUser = () =>
  getTelegramWebApp()?.initDataUnsafe?.user ?? null;

export const prepareTelegramWebApp = () => {
  const webApp = getTelegramWebApp();
  if (!webApp) return;

  webApp.ready();
  webApp.expand();
};
