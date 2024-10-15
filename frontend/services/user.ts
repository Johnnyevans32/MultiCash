import type {
  IResponse,
  IUser,
  UpdatePasswordDTO,
  UpdateUserDTO,
  IUserSession,
} from "~/types/user";

export class UserService {
  async me() {
    const { useCustomFetch } = useAppVueUtils();
    const { data } = await useCustomFetch<IResponse<IUser>>(`/api/users`, {
      method: "get",
    });
    return data;
  }

  async checkIfTagExist(tag: string) {
    const { useCustomFetch } = useAppVueUtils();
    const { data } = await useCustomFetch<IResponse<boolean>>(
      `/api/users/${tag}`,
      {
        method: "get",
      }
    );
    return data;
  }

  async updateUser(payload: UpdateUserDTO) {
    const { useCustomFetch } = useAppVueUtils();
    return useCustomFetch(`/api/users`, {
      method: "put",
      body: payload,
    });
  }

  async updatePassword(payload: UpdatePasswordDTO) {
    const { useCustomFetch } = useAppVueUtils();
    return useCustomFetch(`/api/users/password`, {
      method: "put",
      body: payload,
    });
  }

  async deleteUser() {
    const { useCustomFetch } = useAppVueUtils();
    return useCustomFetch(`/api/users`, {
      method: "delete",
    });
  }

  async updateTag(payload: { tag: string }) {
    const { useCustomFetch } = useAppVueUtils();
    return useCustomFetch(`/api/users/tag`, {
      method: "put",
      body: payload,
    });
  }

  async uploadFile(payload: any) {
    const { useCustomFetch } = useAppVueUtils();
    const { data } = await useCustomFetch<
      IResponse<{ url: string; secure_url: string }>
    >(`/api/files`, {
      method: "post",
      body: payload,
    });
    return data;
  }

  async saveSessionFcmToken(sessionClientId: string, fcmToken: string) {
    const { useCustomFetch } = useAppVueUtils();
    return useCustomFetch(`/api/users/sessions/fcm-token`, {
      method: "put",
      body: { sessionClientId, fcmToken },
    });
  }

  async fetchUserSessions() {
    const { useCustomFetch } = useAppVueUtils();
    const { data } = await useCustomFetch<IResponse<IUserSession[]>>(
      `/api/users/sessions`,
      {
        method: "get",
      }
    );
    return data;
  }

  async logoutSession(sessionClientId?: string) {
    const { useCustomFetch } = useAppVueUtils();
    return useCustomFetch(`/api/users/logout/${sessionClientId}`, {
      method: "put",
    });
  }

  async userSessionPing(sessionClientId: string) {
    const { useCustomFetch } = useAppVueUtils();
    await useCustomFetch(`/api/users/sessions/${sessionClientId}/ping`, {
      method: "put",
    });
  }
}
