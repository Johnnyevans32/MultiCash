import type { IResponse, SigninDTO, SignupDTO } from "~/types/user";

export class AuthService {
  async signin(payload: SigninDTO) {
    const { useCustomFetch } = useAppVueUtils();
    const {
      data: { accessToken },
    } = await useCustomFetch<IResponse<{ accessToken: string }>>(
      `/api/auth/signin`,
      {
        method: "post",
        body: payload,
      }
    );

    return accessToken;
  }

  async signup(payload: SignupDTO) {
    const { useCustomFetch } = useAppVueUtils();
    await useCustomFetch(`/api/auth/signup`, {
      method: "post",
      body: payload,
    });
  }

  async forgotPassword(email: string) {
    const { useCustomFetch } = useAppVueUtils();
    return useCustomFetch(`/api/auth/forgot_password`, {
      method: "put",
      body: { email },
    });
  }

  async resetPassword(payload: { token: string; newPassword: string }) {
    const { useCustomFetch } = useAppVueUtils();
    return useCustomFetch(`/api/auth/reset_password`, {
      method: "put",
      body: payload,
    });
  }
}
