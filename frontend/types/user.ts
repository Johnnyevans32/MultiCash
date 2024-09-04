export interface IUser {
  id: string;
  email: string;
  name: string;
  profileImage: string;
}

export interface UpdateUserDTO {
  name?: string;
  profileImage?: string;
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
}

export interface SignupDTO extends SigninDTO {
  name: string;
}

export interface UpdatePasswordDTO {
  oldPassword: string;
  newPassword: string;
}
