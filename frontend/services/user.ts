import type {
  IResponse,
  IUser,
  UpdatePasswordDTO,
  UpdateUserDTO,
} from "~/types/user";

export class UserService {
  async me() {
    const { useCustomFetch } = useAppVueUtils();
    const { data } = await useCustomFetch<IResponse<IUser>>(`/api/users`, {
      method: "get",
    });

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
}
