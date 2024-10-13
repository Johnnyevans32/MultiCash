import { Injectable } from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";

import configuration from "@/core/services/configuration";

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: configuration().cloudinary.cloudName,
      api_key: configuration().cloudinary.apiKey,
      api_secret: configuration().cloudinary.apiSecret,
      secure: true,
    });
  }

  async uploadFileToCloudinary(
    fileBuffer: Buffer,
    fileName: string,
    fileType: string
  ) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          public_id: fileName,
        },
        (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result);
        }
      );

      uploadStream.end(fileBuffer);
    });
  }
}
