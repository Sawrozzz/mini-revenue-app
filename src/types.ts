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
  timestamp: string;
};

export type Camera = {
  url: string;
  fileName?: string;
  mimeType?: string;
  byteSize: number;
};

export type FileModule = {
  url: string;
  fileName?: string;
  mimeType?: string;
  extension?: string;
  byteSize?: number;
  previewUrl?: string;
};

export type Gallery = {
  images: FileModule[];
};

export type DevicePermissionResponse<T> = {
  status: PermissionStatus;
  data?: T;
  error?: string;
};
