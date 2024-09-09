import { Injectable } from "@nestjs/common";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { Buffer } from "buffer";

@Injectable()
export class FileService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadFile(payload: {
    file: string;
    fileName: string;
    fileType: string;
  }) {
    const { file, fileName, fileType } = payload;

    if (!file || !fileName || !fileType) {
      throw new Error("Invalid payload: Missing file, fileName, or fileType.");
    }

    const fileBuffer = this.decodeBase64File(file);

    if (!fileBuffer) {
      throw new Error("Invalid file format: Unable to decode base64 file.");
    }

    return await this.cloudinaryService.uploadFileToCloudinary(
      fileBuffer,
      fileName,
      fileType
    );
  }

  private decodeBase64File(dataString: string) {
    try {
      const [mime, base64] = dataString.split("data:").pop().split(";base64,");
      return Buffer.from(base64, "base64");
    } catch (error) {
      console.error("Error decoding base64 file:", error);
      return null;
    }
  }
}
