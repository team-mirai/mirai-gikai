import type { Bill } from "../../shared/types";
import { findBillById } from "../repositories/bill-edit-repository";

export async function getBillById(id: string): Promise<Bill | null> {
  try {
    return await findBillById(id);
  } catch (error) {
    console.error("Failed to fetch bill:", error);
    return null;
  }
}
