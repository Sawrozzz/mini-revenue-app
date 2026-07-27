import { useState } from "react";
import type {
  DriverLicense,
  Location,
  Camera,
  FileModule,
  PermissionStatus,
} from "./types";
import {
  PlatformSdkProvider,
  usePlatformSdk,
  usePlatformUser,
} from "./sdk/SdkContext";
import { Loader } from "./components/Loader";
import { Info } from "./components/Info";
import { FileIcon } from "./components/FileIcon";
import "./index.css";

const MODULE_ID = "mini-revenue-app";
const CHAT_MODULE_ID = "chat-mini-app";

function MiniRevenueLicenseApp() {
  const sdk = usePlatformSdk();
  const user = usePlatformUser();

  const [loading, setLoading] = useState(false);
  const [navResult, setNavResult] = useState("");
  const [navLoading, setNavLoading] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [loadLocation, setLoadLocation] = useState(false);
  const [error, setError] = useState("");
  const [cameraResponse, setCameraResponse] = useState<Camera | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loadCamera, setLoadCamera] = useState(false);
  const [devicePermission, setDevicePermission] =
    useState<PermissionStatus | null>(null);
  const [cameraPermission, setCameraPermission] =
    useState<PermissionStatus | null>(null);
  const [license, setLicense] = useState<DriverLicense | null>(null);

  const [gallery, setGallery] = useState<FileModule[] | null>(null);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  const [webImages, setWebImages] = useState<FileModule[] | null>(null);
  const [webImagesLoading, setWebImagesLoading] = useState(false);
  const [webImagesError, setWebImagesError] = useState<string | null>(null);

  const [documents, setDocuments] = useState<FileModule[] | null>(null);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);

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
    setError("");
    try {
      const res = await sdk.device.location({
        reason: "To view your current location",
      });
      console.log("Location data", res);
      setDevicePermission(res.status);
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
      setDevicePermission("denied");
    } finally {
      setLoadLocation(false);
    }
  };

  const handleOpenCamera = async () => {
    setLoadCamera(true);
    setCameraResponse(null);
    setCameraError(null);
    try {
      const res = await sdk.device.camera({
        reason: "To capture a photo for verification",
      });
      setCameraPermission(res.status);
      switch (res.status) {
        case "granted":
          setCameraResponse(res.data!);
          break;

        case "denied":
          setCameraError("Camera permission denied.");
          break;

        case "parmanentlyDenied":
          setCameraError(
            "Please enable camera permission from device settings.",
          );
          break;

        case "restricted":
          setCameraError("Camera access is restricted on this device.");
          break;
      }
    } catch (error) {
      setCameraError(
        error instanceof Error ? error.message : "Failed to open camera.",
      );
      setCameraPermission("denied");
    } finally {
      setLoadCamera(false);
    }
  };

  const handleImages = async () => {
    setGalleryLoading(true);
    setGalleryError(null);

    try {
      const res = await sdk.device.gallery({
        reason: "To select images",
        multiple: false,
      });
      switch (res.status) {
        case "granted":
          setGallery(res.data!.images ?? res.data!);
          break;
        case "denied":
          setGalleryError("Image upload cancelled.");
          break;
        case "parmanentlyDenied":
          setGalleryError(
            "Please enable gallery permission from device settings.",
          );
          break;
        case "restricted":
          setGalleryError("Gallery access is restricted on this device.");
          break;
      }
    } catch (error) {
      setGalleryError(
        error instanceof Error ? error.message : "Failed to open gallery.",
      );
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleImageUploadByWebOnly = async () => {
    setWebImagesLoading(true);
    setWebImagesError(null);

    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*";

    input.onchange = () => {
      if (!input.files || input.files.length === 0) {
        setWebImagesError("No files selected.");
        setWebImagesLoading(false);
        return;
      }

      const files: FileModule[] = Array.from(input.files).map((file) => {
        const blobUrl = URL.createObjectURL(file);
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        return {
          url: blobUrl,
          previewUrl: blobUrl,
          fileName: file.name,
          mimeType: file.type || "image/jpeg",
          extension: ext,
          byteSize: file.size,
        };
      });

      setWebImages(files);
      setWebImagesLoading(false);
    };

    const onFocus = () => {
      setTimeout(() => {
        if (!input.files || input.files.length === 0) {
          setWebImagesError("File picker closed.");
          setWebImagesLoading(false);
        }
      }, 300);
    };
    window.addEventListener("focus", onFocus, { once: true });

    input.click();
  };

  const handleFileUpload = async () => {
    setDocumentsLoading(true);
    setDocumentsError(null);

    try {
      const res = await sdk.device.files({
        reason: "To select documents",
        multiple: true,
      });
      switch (res.status) {
        case "granted":
          setDocuments(res.data!.files ?? res.data!);
          break;
        case "denied":
          setDocumentsError("File access denied.");
          break;
        case "parmanentlyDenied":
          setDocumentsError("Please enable file access from device settings.");
          break;
        case "restricted":
          setDocumentsError("File access is restricted on this device.");
          break;
      }
    } catch (error) {
      setDocumentsError(
        error instanceof Error ? error.message : "Failed to open file picker.",
      );
    } finally {
      setDocumentsLoading(false);
    }
  };

  const imageSrc = cameraResponse?.url.startsWith("data:")
    ? cameraResponse.url
    : cameraResponse?.url.startsWith("http://") ||
        cameraResponse?.url.startsWith("https://")
      ? cameraResponse.url
      : `data:${cameraResponse?.mimeType};base64,${cameraResponse?.url}`;

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
        className="rounded border py-2 px-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 mt-4"
        onClick={handleImages}
        disabled={galleryLoading}
      >
        Select Images
      </button>

      {galleryLoading && (
        <div className="mt-2">
          <Loader />
        </div>
      )}

      {galleryError && !galleryLoading && (
        <div className="mt-2 text-sm text-rose-600">{galleryError}</div>
      )}

      {!galleryLoading && gallery && gallery.length > 0 && (
        <div className="mt-4 w-full max-w-xl space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">
            Selected Images ({gallery.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {gallery.map((img, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
              >
                <img
                  src={img.previewUrl || img.url}
                  alt={img.fileName || `Image ${idx + 1}`}
                  className="w-full h-32 object-cover"
                />
                <div className="p-2 text-xs text-slate-600 space-y-1">
                  <p className="truncate font-medium">
                    {img.fileName || `image_${idx + 1}`}
                  </p>
                  {img.byteSize && (
                    <p className="text-slate-400">
                      {(img.byteSize / 1024).toFixed(1)} KB
                    </p>
                  )}
                  {img.mimeType && (
                    <p className="text-slate-400 truncate">{img.mimeType}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-medium text-slate-500">
              View Raw Response
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded-lg border bg-slate-900 p-3 text-xs text-slate-100">
              {JSON.stringify(gallery, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <button
        className="rounded border py-2 px-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 mt-4"
        onClick={handleImageUploadByWebOnly}
        disabled={webImagesLoading}
      >
        Select Images (Web Only)
      </button>

      {webImagesLoading && (
        <div className="mt-2">
          <Loader />
        </div>
      )}

      {webImagesError && !webImagesLoading && (
        <div className="mt-2 text-sm text-rose-600">{webImagesError}</div>
      )}

      {!webImagesLoading && webImages && webImages.length > 0 && (
        <div className="mt-4 w-full max-w-xl space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">
            Web Images ({webImages.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {webImages.map((img, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
              >
                <img
                  src={img.previewUrl || img.url}
                  alt={img.fileName || `Image ${idx + 1}`}
                  className="w-full h-32 object-cover"
                />
                <div className="p-2 text-xs text-slate-600 space-y-1">
                  <p className="truncate font-medium">
                    {img.fileName || `image_${idx + 1}`}
                  </p>
                  {img.byteSize && (
                    <p className="text-slate-400">
                      {(img.byteSize / 1024).toFixed(1)} KB
                    </p>
                  )}
                  {img.mimeType && (
                    <p className="text-slate-400 truncate">{img.mimeType}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-medium text-slate-500">
              View Raw Response
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded-lg border bg-slate-900 p-3 text-xs text-slate-100">
              {JSON.stringify(webImages, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <button
        className="rounded border py-2 px-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 mt-4"
        onClick={handleFileUpload}
        disabled={documentsLoading}
      >
        Upload Documents
      </button>

      {documentsLoading && (
        <div className="mt-2">
          <Loader />
        </div>
      )}

      {documentsError && !documentsLoading && (
        <div className="mt-2 text-sm text-rose-600">{documentsError}</div>
      )}

      {!documentsLoading && documents && documents.length > 0 && (
        <div className="mt-4 w-full max-w-xl space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">
            Selected Documents ({documents.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {documents.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <FileIcon extension={doc.extension} mimeType={doc.mimeType} />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">
                    {doc.fileName || `file_${idx + 1}`}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {doc.byteSize && (
                      <span>{(doc.byteSize / 1024).toFixed(1)} KB</span>
                    )}
                    {doc.extension && (
                      <span className="uppercase">.{doc.extension}</span>
                    )}
                  </div>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Open
                </a>
              </div>
            ))}
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-medium text-slate-500">
              View Raw Response
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded-lg border bg-slate-900 p-3 text-xs text-slate-100">
              {JSON.stringify(documents, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <button
        className="rounded border py-2 px-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 mt-4"
        onClick={handleViewLocation}
        disabled={loadLocation}
      >
        Your location
      </button>

      {loadLocation && (
        <div className="mt-2">
          <Loader />
        </div>
      )}

      {error && !loadLocation && devicePermission !== "granted" && (
        <div className="mt-2 text-sm text-rose-600">{error}</div>
      )}

      {!loadLocation && location && (
        <div className="mt-2 text-sm text-slate-600">
          Lat: {location.latitude}, Lng: {location.longitude}, Accuracy:{" "}
          {location.accuracy}, Time:{" "}
          {location?.timestamp ? String(location.timestamp) : ""}
        </div>
      )}

      <button
        className="rounded border py-2 px-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 mt-4"
        onClick={handleOpenCamera}
        disabled={loadCamera}
      >
        Open Camera
      </button>

      {loadCamera && (
        <div className="mt-2">
          <Loader />
        </div>
      )}

      {cameraError && !loadCamera && cameraPermission !== "granted" && (
        <div className="mt-2 text-sm text-rose-600">{cameraError}</div>
      )}

      {!loadCamera && cameraResponse && (
        <div className="mt-4 rounded-lg border bg-slate-50 p-4">
          <img
            src={imageSrc}
            alt={cameraResponse.fileName}
            className="mx-auto max-h-80 max-w-full rounded border object-contain"
          />

          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <div className="rounded bg-white border px-3 py-2">
              <span className="font-medium">File:</span>{" "}
              {cameraResponse.fileName}
            </div>

            <div className="rounded bg-white border px-3 py-2">
              <span className="font-medium">Type:</span>{" "}
              {cameraResponse.mimeType}
            </div>

            <div className="rounded bg-white border px-3 py-2">
              <span className="font-medium">Size:</span>{" "}
              {(cameraResponse.byteSize / 1024).toFixed(2)} KB
            </div>
          </div>

          <details className="mt-5">
            <summary className="cursor-pointer font-medium text-slate-700">
              View Raw Response
            </summary>

            <pre className="mt-3 max-h-64 overflow-auto rounded-lg border bg-slate-900 p-4 text-xs text-slate-100">
              {JSON.stringify(cameraResponse, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <PlatformSdkProvider>
      <MiniRevenueLicenseApp />
    </PlatformSdkProvider>
  );
}
