import {
  useEffect,
  useState,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import "./index.css";

const MODULE_ID = "mini-revenue-app";
const CHAT_MODULE_ID = "chat-mini-app";

export type DriverLicense = {
  licenseNumber: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "M" | "F" | "O";
  address: Address;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  licenseClass: string;
  vehicleCategories: string[];
  restrictions: string;
  bloodGroup: string;
  photoUrl: string;
  signatureUrl: string;
  isOrganDonor: boolean;
  status: "Active" | "Inactive" | "Expired" | "Suspended";
};

export type Address = {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type PermissionStatus =
  | "granted"
  | "denied"
  | "parmanentlyDenied"
  | "restricted";

export type Location = {
  longitude: number;
  latitude: number;
  accuracy?: number;
};
export type Camera = {
  url?: string;
  fileName?: string;
  mimeType?: string;
  byteSize: number;
};

export type DevicePermissionRespons<T> = {
  status: PermissionStatus;
  data?: T;
  error?: string;
};

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

function getSdk(id: string) {
  return window.getMiniAppBridge?.()?.getInstance(id) ?? null;
}

function PlatformSdkProvider({
  moduleId,
  children,
}: {
  moduleId: string;
  children: ReactNode;
}) {
  const [sdk, setSdk] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const tryGetSdk = async () => {
      for (let attempt = 0; attempt < 10; attempt++) {
        if (cancelled) return;

        const instance = getSdk(moduleId);

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
  }, [moduleId]);

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

function usePlatformSdk() {
  const { sdk } = useContext(SdkContext);
  if (!sdk)
    throw new Error("usePlatformSdk must be used within PlatformSdkProvider");
  return sdk;
}

function usePlatformUser() {
  const { user } = useContext(SdkContext);
  return user;
}

function MiniRevenueLicenseApp() {
  const sdk = usePlatformSdk();
  const user = usePlatformUser();

  const [loading, setLoading] = useState(false);
  const [navResult, setNavResult] = useState("");
  const [navLoading, setNavLoading] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [loadLocation, setLoadLocation] = useState(false);
  const [error, setError] = useState("");
  const [cameraResponse, setCameraResponse] = useState<string| null>(null);
  const [cameraError, setCameraError] = useState<string| null>(null);
  const [loadCamera, setLoadCamera] = useState(false);
  const [locationPermission, setLocationPermission] = useState<PermissionStatus| null>(null);
  const [license, setLicense] = useState<DriverLicense | null>(null);

  const userName = user?.name ?? user?.fullName ?? "Guest";

  const handleHttpGet = async () => {
    setLoading(true);
    try {
      const res = await sdk.http.post({
        endpoint: "/api/driving-license",
        body: { method: "GET", path: "/v1/license" },
        headers: { "x-app-id": MODULE_ID },
      });

      if (res.data.data) {
        setLicense(res.data.data.driverLicense);
      } else {
        setError(res.data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = async () => {
    setNavLoading(true);
    setNavResult("");
    try {
      const payload = {
        purpose: "Want to chat with AI",
        sourceApp: MODULE_ID,
        timestamp: Date.now().toString(),
      };
      await sdk.navigation.navigate({
        route: "/",
        app: CHAT_MODULE_ID,
        params: payload,
      });
      setNavResult("Payment workflow initialized!");
    } catch (err) {
      setNavResult(
        `Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setNavLoading(false);
    }
  };

  const handleViewLocation = async () => {
    setLoadLocation(true);
    try {
      const res = await sdk.device.location({
        reason: "To view your current location",
      });
      setLocationPermission(res.status);
      switch (res.status) {
        case "granted":
          setLocation(res.data!);
          break;

        case "denied":
          setError("Location permission denied.");
          break;

        case "parmanentlyDenied":
          setError("Please enable location permission from device settings.");
          break;

        case "restricted":
          setError("Location access is restricted on this device.");
          break;
      }
    } catch (error) {
      setError((error as any).message);
      setLocationPermission("denied");
    } finally {
      setLoadLocation(false);
    }
  };

  const handleOpenCamera = async () => {
    setLoadCamera(true);
    setCameraResponse(null);
    setCameraError(null);
    try {
      const res = await sdk.device.camera();
      setCameraResponse(JSON.stringify(res, null, 2));
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : "Failed to open camera.");
    } finally {
      setLoadCamera(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 md:p-8 antialiased">
      <div className="max-w-xl w-full space-y-6">
        {/* Main ID Card Container */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/80 border border-slate-200/60 overflow-hidden transition-all">
          {/* Header */}
          <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 p-2.5 rounded-xl text-xl border border-slate-700">
                🪪
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-wide uppercase text-slate-400">
                  Digital ID Wallet
                </h1>
                <p className="text-xs text-slate-500">Welcome, {userName}</p>
              </div>
            </div>
            {license && (
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                  license.status === "Active"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                ● {license.status}
              </span>
            )}
          </div>

          <div className="p-6">
            {!license ? (
              <button
                onClick={handleHttpGet}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold transition shadow-sm"
              >
                {loading ? "Loading License..." : "Show My Driving License"}
              </button>
            ) : (
              <div className="space-y-6">
                {/* Visual License Representation */}
                <div className="relative bg-linear-to-br from-slate-50 to-slate-100/50 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                  {/* Photo & Name Section */}
                  <div className="flex flex-col items-center text-center sm:text-left">
                    <div className="w-28 h-36 bg-slate-200 rounded-xl overflow-hidden shadow-sm border-2 border-white ring-1 ring-slate-200">
                      <img
                        src={
                          license.photoUrl ||
                          "https://thumbs.dreamstime.com/b/man-feeling-suspicious-face-expression-emotion-hesitating-facial-studio-shot-white-isolated-background-copy-space-90927117.jpg"
                        }
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="mt-3 font-bold text-slate-800 text-sm leading-tight">
                      {license.firstName} {license.lastName}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {license.licenseNumber}
                    </p>
                  </div>

                  {/* Top-level Quick Details on Card */}
                  <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 text-xs w-full">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Class
                      </p>
                      <p className="font-semibold text-slate-700">
                        {license.licenseClass}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Expires
                      </p>
                      <p className="font-semibold text-rose-600">
                        {license.expiryDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        DOB
                      </p>
                      <p className="font-semibold text-slate-700">
                        {license.dateOfBirth}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Blood
                      </p>
                      <p className="font-semibold text-slate-700">
                        {license.bloodGroup}
                      </p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-200/60 mt-1">
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Categories
                      </p>
                      <p className="font-medium text-slate-600">
                        {license.vehicleCategories.join(", ")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Extended Details Grid (Clean Layout) */}
                <div className="divide-y divide-slate-100 border-t border-b border-slate-100 py-2">
                  <div className="grid grid-cols-2 gap-x-4">
                    <Info label="Gender" value={license.gender} />
                    <Info label="Issue Date" value={license.issueDate} />
                  </div>
                  <Info
                    label="Address"
                    value={`${license.address.street}, ${license.address.city}, ${license.address.state}`}
                  />
                  <Info
                    label="Issuing Authority"
                    value={license.issuingAuthority}
                  />
                  <div className="grid grid-cols-2 gap-x-4">
                    <Info
                      label="Restrictions"
                      value={license.restrictions || "None"}
                    />
                    <Info
                      label="Organ Donor"
                      value={license.isOrganDonor ? "❤️ Yes" : "No"}
                    />
                  </div>
                </div>

                {/* Security Signature Block */}
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Official Signature
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Digitally Verified ID
                    </p>
                  </div>
                  <img
                    src={license.signatureUrl}
                    alt="Signature"
                    className="h-10 object-contain mix-blend-multiply opacity-80"
                  />
                </div>
              </div>
            )}
          </div>

          {error && <div className="border">{error}</div>}
        </div>

        {/* Action / Chat app Module */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
          <button
            onClick={handleNavigate}
            disabled={navLoading}
            className="bg-blue-600 text-white px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 w-full transition shadow-md shadow-blue-500/10 flex items-center justify-center gap-2"
          >
            {navLoading ? (
              "Processing..."
            ) : (
              <>
                <span>🤖</span>
                <span>Chat With AI</span>
              </>
            )}
          </button>

          {navResult && (
            <pre
              className={`text-left font-mono text-[11px] p-4 rounded-xl overflow-auto max-h-40 border ${
                navResult.startsWith("Error")
                  ? "bg-rose-50 text-rose-700 border-rose-100"
                  : "bg-emerald-50 text-emerald-700 border-emerald-100"
              }`}
            >
              {navResult}
            </pre>
          )}
        </div>
      </div>

      <button
        className="rounded border py-2 px-4 cursor-pointer"
        onClick={handleViewLocation}
        disabled={loadLocation}
      >
        Your location
      </button>
      {error && locationPermission !== "granted" && (
        <div className="text-rose-600 text-sm mt-2">{error}</div>
      )}
      {location && (
        <div className="text-slate-600 text-sm mt-2">
          Lat: {location?.latitude}, Lng: {location?.longitude} , Accuracy: {" "}
          {location?.accuracy}
        </div>
      )}

      <button
        className="rounded border py-2 px-4 cursor-pointer mt-4"
        onClick={handleOpenCamera}
        disabled={loadCamera}
      >
        {loadCamera ? "Opening camera..." : "Open Camera"}
      </button>
      {cameraResponse && (
        <pre className="text-left font-mono text-xs p-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 mt-2 overflow-auto max-h-48">
          {cameraResponse}
        </pre>
      )}
      {cameraError && (
        <div className="text-rose-600 text-sm mt-2">{cameraError}</div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="font-medium text-slate-800 mt-0.5 text-sm">{value}</p>
    </div>
  );
}

export default function App() {
  return (
    <PlatformSdkProvider moduleId={MODULE_ID}>
      <MiniRevenueLicenseApp />
    </PlatformSdkProvider>
  );
}
