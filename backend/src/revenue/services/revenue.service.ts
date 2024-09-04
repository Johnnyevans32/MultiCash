import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { REVENUE } from "@/core/constants/schema.constants";
import { RevenueDocument } from "../schemas/revenue.schema";
import { CreateRevenueDTO } from "../dtos/revenue.dto";

@Injectable()
export class RevenueService {
  constructor(
    @InjectModel(REVENUE) private revenueModel: Model<RevenueDocument>
  ) {}

  async createRevenue(payload: CreateRevenueDTO) {
    const { amount, currency, source, reference, meta } = payload;
    await this.revenueModel.findOneAndUpdate(
      { isDeleted: false, reference },
      { $set: { amount, currency, source, meta } },
      { upsert: true, new: true }
    );
  }
}
