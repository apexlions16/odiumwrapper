export {};
declare global {
  interface Window {
    odiumDesktop?: {
      getVersion: () => Promise<string>;
      checkForUpdates: () => Promise<unknown>;
      downloadUpdate: () => Promise<unknown>;
      installUpdate: () => Promise<unknown>;
      openExternal: (url: string) => Promise<unknown>;
      onUpdateStatus: (listener: (payload: unknown) => void) => () => void;
    };
  }
}
