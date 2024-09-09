import { Module } from "@nestjs/common";

import { FileController } from "./file.controller";
import { FileService } from "./services/file.service";
import { CloudinaryService } from "./cloudinary/cloudinary.service";

@Module({
  controllers: [FileController],
  providers: [FileService, CloudinaryService],
})
export class FileModule {}
