interface GovSdkAuth {
  getUser(): Promise<GovSdkUser | null>;
  isAuthenticated(): Promise<boolean>;
  logout(): Promise<void>;
}

interface GovSdkUser {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  nationalId?: string;
  roles: string[];
  permissions: string[];
  avatar?: string;
}

 interface GovDeviceLocationModule {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

 interface GovDeviceCameraModule {
  uri: string;
  base64?: string;
  width?: number;
  height?: number;
}

 interface GovDeviceSdkModule {
  camera(): Promise<GovDeviceCameraModule>;
  location(): Promise<GovDeviceLocationModule>;
}



interface GovSdkHttp {
  get<T = unknown>(
    endpoint?: string,
    query?: Record<string, string>,
    headers?: Record<string, string>
  ): Promise<{ status: number; data: T; headers: Record<string, string> }>;
  post<T = unknown>(
    endpoint?: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<{ status: number; data: T; headers: Record<string, string> }>;
  put<T = unknown>(
    endpoint?: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<{ status: number; data: T; headers: Record<string, string> }>;
  patch<T = unknown>(
    endpoint?: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<{ status: number; data: T; headers: Record<string, string> }>;
  delete<T = unknown>(
    endpoint?: string,
    headers?: Record<string, string>
  ): Promise<{ status: number; data: T; headers: Record<string, string> }>;
}

interface GovSdkPlatform {
  readonly type: 'WEB' | 'ANDROID' | 'IOS';
  isWeb(): boolean;
  isAndroid(): boolean;
  isIOS(): boolean;
  isMobile(): boolean;
}

interface GovSdkInstance {
  readonly moduleId: string;
  readonly version: string;
  readonly traceId: string;
  auth: GovSdkAuth;
  http: GovSdkHttp;
  platform: GovSdkPlatform;
  device:GovDeviceSdkModule; 
  destroy(): void;
}

interface GovSdkRegistry {
  createInstance(
    moduleId: string,
    options?: { timeout?: number; retryAttempts?: number; retryDelayMs?: number }
  ): Promise<GovSdkInstance>;
  getInstance(moduleId: string): GovSdkInstance | null;
  destroyInstance(moduleId: string): void;
  hasInstance(moduleId: string): boolean;
  getActiveModuleIds(): string[];
}

interface Window {
  getMiniAppBridge(): GovSdkRegistry | undefined;
}
 