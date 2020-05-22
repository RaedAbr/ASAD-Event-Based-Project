import * as dotenv from "dotenv";
import { logger } from "./Logger";

const path = `${__dirname}/.env`;
dotenv.config({ path: path });

export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;