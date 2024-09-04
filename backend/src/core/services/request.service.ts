import axios, { AxiosRequestConfig, AxiosInstance } from "axios";
import { merge } from "lodash";

export class RequestService {
  private $axios: AxiosInstance;

  constructor(config?: AxiosRequestConfig) {
    this.$axios = axios.create(config);
  }

  setRequestConfig(config: AxiosRequestConfig): void {
    this.$axios = axios.create(config);
  }

  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const { data } = await this.$axios.request<T>(config);
    return data;
  }
}
