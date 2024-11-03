import { HttpStatus, Injectable } from "@nestjs/common";
import { Response } from "express";
import { join } from "path";
import * as bcrypt from "bcrypt";
import { configure, Environment } from "nunjucks";
import * as moment from "moment";
import { ResponseService } from "./response.service";
import { randomBytes } from "crypto";
import axios, { AxiosError } from "axios";
import configuration from "./configuration";
import puppeteer from "puppeteer";

@Injectable()
export class UtilityService {
  private engine: Environment;

  constructor() {
    const path = join(__dirname, "../../../", "templates");
    this.engine = configure(path, { autoescape: true });
  }
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
      const statusCode = error.statusCode || HttpStatus.BAD_REQUEST;
      const errorMessage = UtilityService.getErrorMessage(error);
      return ResponseService.json(
        res,
        statusCode,
        errorMessage,
        undefined,
        undefined
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
      const response = await axios.get(
        `http://api.ipapi.com/api/${ip}?access_key=${configuration().ipapi.accessKey}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching IP location:", error);
      return null;
    }
  }

  static formatLocationString(locationData: any) {
    if (!locationData) return "Unknown Location";

    const city = locationData.city || "Unknown City";
    const region = locationData.region_name || "Unknown Region";
    const country = locationData.country_name || "Unknown Country";

    return `${city}, ${region}, ${country}`;
  }

  async generatePDF(data: any, template: string) {
    const body = this.engine.render(template, {
      ...data,
      year: moment().format("YYYY"),
    });

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: configuration().isDeployed
        ? configuration().puppeteer.executablePath
        : puppeteer.executablePath(),
      args: ["--no-sandbox", "--disable-gpu"],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(body);
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
      });

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }

  static generateRandomName() {
    const adjectives = ["Swift", "Bright", "Bold", "Silent", "Quick"];
    const nouns = ["Eagle", "Falcon", "Tiger", "Lion", "Wolf"];
    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

    return `${randomAdjective} ${randomNoun}`;
  }

  static getErrorMessage(error: any) {
    let errorMessage: string;

    if (error.isAxiosError) {
      const { response, message, code } = error as AxiosError;
      errorMessage =
        (response?.data as any)?.message || message || "Something went wrong";
      console.error(`Axios error occurred: ${errorMessage} (${code})`);
    } else {
      errorMessage = error.message || "Something went wrong";
      console.error(`An error occurred: ${error.message}`, error.stack);
    }
    return errorMessage;
  }

  static getWiseErrorMessgae(error: any) {
    const { response, message } = error as AxiosError;
    return (
      ((response?.data as any)?.errors || [])[0]?.message ||
      (response?.data as any)?.message ||
      message
    );
  }

  static generateRandomPhoneNumber(phoneExt: string) {
    const randomDigits = (length: number) => {
      let digits = "";
      for (let i = 0; i < length; i++) {
        digits += Math.floor(Math.random() * 10);
      }
      return digits;
    };

    let phoneNumber = phoneExt;
    switch (phoneExt) {
      case "+1": // United States / Canada
        phoneNumber += `${randomDigits(3)}-${randomDigits(3)}-${randomDigits(4)}`;
        break;

      case "+44": // United Kingdom
        phoneNumber += ` ${randomDigits(4)} ${randomDigits(6)}`;
        break;

      case "+234": // Nigeria
        phoneNumber += ` ${randomDigits(3)} ${randomDigits(3)} ${randomDigits(4)}`;
        break;

      case "+91": // India
        phoneNumber += ` ${randomDigits(5)} ${randomDigits(5)}`;
        break;

      case "+61": // Australia
        phoneNumber += ` ${randomDigits(4)} ${randomDigits(3)} ${randomDigits(3)}`;
        break;

      default:
        // Generic format for unknown country codes
        phoneNumber += ` ${randomDigits(3)} ${randomDigits(3)} ${randomDigits(4)}`;
        break;
    }

    return phoneNumber;
  }
}
