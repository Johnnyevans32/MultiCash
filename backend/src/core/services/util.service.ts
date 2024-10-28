import { HttpStatus, Injectable } from "@nestjs/common";
import { Response } from "express";
import { join } from "path";
import * as bcrypt from "bcrypt";
import { configure, Environment } from "nunjucks";
import * as moment from "moment";
import * as html2pdf from "html-pdf";
import { ResponseService } from "./response.service";
import { randomBytes } from "crypto";
import axios, { AxiosError } from "axios";
import configuration from "./configuration";
import { Stream } from "stream";
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

  async _generatePDF(data: any, template: string) {
    const body = this.engine.render(template, {
      ...data,
      year: moment().format("YYYY"),
    });

    const options: html2pdf.CreateOptions = {
      format: "A4",
      orientation: "portrait",
      border: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
      type: "pdf",
    };
    const promise = await new Promise<Stream>((resolve, reject) => {
      html2pdf
        .create(body, options)
        .toStream((error: any, stream: Stream | PromiseLike<Stream>) => {
          if (error) {
            reject(error);
          }

          resolve(stream);
        });
    });

    return promise;
  }

  async generatePDF(data: any, template: string) {
    const body = this.engine.render(template, {
      ...data,
      year: moment().format("YYYY"),
    });

    const browser = await puppeteer.launch({
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
      executablePath:
        configuration().env === "production"
          ? configuration().puppeteer.executablePath
          : puppeteer.executablePath(),
    });
    try {
      const page = await browser.newPage();
      await page.setContent(body, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }
}
