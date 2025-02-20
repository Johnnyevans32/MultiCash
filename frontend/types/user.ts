export interface IUser {
  id: string;
  email: string;
  name: string;
  profileImage: string;
  country: string;
  did: string;
  tag: string;
  pushNotificationIsEnabled: boolean;
  intercomHash: string;
}

export interface UpdateUserDTO {
  name?: string;
  profileImage?: string;
  did?: string;
  pushNotificationIsEnabled?: boolean;
}
export interface IResponse<T> {
  code?: string;
  message?: string;
  data: T;
  metadata?: IMetadata;
}

export interface IMetadata {
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage?: number;
  nextPage?: number;
}

export interface SigninDTO {
  email: string;
  password: string;
  sessionClientId?: string;
}

export interface SignupDTO extends SigninDTO {
  name: string;
  country: string;
  did?: string;
}

export interface UpdatePasswordDTO {
  oldPassword: string;
  newPassword: string;
}

export const SupportedCountries = [
  { name: "Nigeria", code: "NG" },
  { name: "Ghana", code: "GH" },
  { name: "Kenya", code: "KE" },
  { name: "South Africa", code: "ZA" },
];

export interface IUserSession {
  userAgent: string;
  ipAddress: string;
  lastActivity: string;
  id: string;
  sessionClientId: string;
  location: string;
}
