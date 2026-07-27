import {
  useEffect,
  useState,
  createContext,
  useContext,
  type ReactNode,
} from "react";

interface SdkContextValue {
  sdk: any | null;
  user: any | null;
  isReady: boolean;
  error: Error | null;
}

const SdkContext = createContext<SdkContextValue>({
  sdk: null,
  user: null,
  isReady: false,
  error: null,
});

function getSdk() {
  return window.getMiniAppBridge?.()?.getActiveInstance() ?? null;
}

function LoadError({
  message = "Failed to load the application.",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-lg">
        <div className="mb-4 text-5xl">⚠️</div>

        <h1 className="mb-2 text-2xl font-semibold text-gray-900">
          Failed to Load
        </h1>

        <p className="mb-6 text-sm text-gray-600">{message}</p>

        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export function PlatformSdkProvider({ children }: { children: ReactNode }) {
  const [sdk, setSdk] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const tryGetSdk = async () => {
      for (let attempt = 0; attempt < 10; attempt++) {
        if (cancelled) return;

        const instance = getSdk();

        if (instance) {
          try {
            const u = await instance.auth.getUser();
            if (cancelled) return;

            setSdk(instance);
            setUser(u);
            setIsReady(true);
            return;
          } catch {
            if (cancelled) return;
            await new Promise((r) => setTimeout(r, 200));
            continue;
          }
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      if (!cancelled) {
        setError(new Error("SDK not injected after retries."));
      }
    };

    tryGetSdk();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <LoadError message={error.message} />;
  }

  if (!isReady) return <div>Connecting to platform...</div>;

  return (
    <SdkContext.Provider value={{ sdk, user, isReady, error }}>
      {children}
    </SdkContext.Provider>
  );
}

export function usePlatformSdk() {
  const { sdk } = useContext(SdkContext);
  if (!sdk)
    throw new Error("usePlatformSdk must be used within PlatformSdkProvider");
  return sdk;
}

export function usePlatformUser() {
  const { user } = useContext(SdkContext);
  return user;
}
