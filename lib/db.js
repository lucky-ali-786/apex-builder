import { PrismaClient } from "./generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const prismaclient = () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};
const prisma = globalThis.prismaGlobal ?? prismaclient();
export default prisma;
if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}