import { HttpStatus, Injectable } from "@nestjs/common";
import { Response } from "express";
import * as bcrypt from "bcrypt";
import { ResponseService } from "./response.service";
import { randomBytes } from "crypto";
import axios, { AxiosError } from "axios";

@Injectable()
export class UtilityService {
  static hashPassword = async (password: string) => {
    const SALT_ROUNDS = 10;
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  };

  static verifyPassword = async (password: string, hashedPassword: string) => {
    return await bcrypt.compare(password, hashedPassword);
  };

  static generateRandomHex(length: number): string {
    return randomBytes(length).toString("hex").slice(0, length);
  }

  static async handleRequest(
    res: Response,
    successMessage: string,
    service: any,
    method: string,
    httpStatusCode: number = HttpStatus.OK,
    ...params: any[]
  ) {
    try {
      const result = await service[method](...params);
      const data = result?.metadata || result?.meta ? result.data : result;
      const metadata = result?.metadata || result?.meta || undefined;

      return ResponseService.json(
        res,
        httpStatusCode,
        successMessage,
        data,
        metadata
      );
    } catch (error) {
      let errorMessage: string;
      const statusCode = error.statusCode || HttpStatus.BAD_REQUEST;

      if (error.isAxiosError) {
        const { response, message, code } = error as AxiosError;
        errorMessage =
          (response?.data as any)?.message || message || "Something went wrong";
        console.error(`Axios error occurred: ${errorMessage} (${code})`);
      } else {
        errorMessage = error.message || "Something went wrong";
        console.error(`An error occurred: ${error.message}`, error.stack);
      }

      return ResponseService.json(
        res,
        statusCode,
        errorMessage,
        undefined,
        undefined,
        statusCode
      );
    }
  }

  static formatMoney(amount: number, currency = "USD", locale = "en-US") {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }

  static async getLocationFromIP(ip: string) {
    try {
      const response = await axios.get(`https://ipapi.co/${ip}/json/`);
      return response.data;
    } catch (error) {
      console.error("Error fetching IP location:", error);
      return null;
    }
  }

  static formatLocationString(locationData: any) {
    if (!locationData) return "Unknown Location";

    const city = locationData.city || "Unknown City";
    const region = locationData.region || "Unknown Region";
    const country = locationData.country_name || "Unknown Country";

    return `${city}, ${region}, ${country}`;
  }
}
