import { Body, Controller, Post, Res } from "@nestjs/common";
import { Response } from "express";
import { HttpStatusCode } from "axios";

import { UtilityService } from "@/core/services/util.service";
import { FileService } from "./services/file.service";

@Controller("files")
export class FileController {
  constructor(private fileService: FileService) {}

  @Post("")
  async uploadFile(@Res() res: Response, @Body() payload: any) {
    return UtilityService.handleRequest(
      res,
      "File upload successful",
      this.fileService,
      "uploadFile",
      HttpStatusCode.Ok,
      payload
    );
  }
}
