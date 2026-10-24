import { seedDemo } from "@/lib/seed";

export const dynamic = "force-dynamic";

/** POST /api/seed — loads the demo dataset, only when the database is empty. */
export async function POST() {
  const result = await seedDemo();
  return Response.json(result);
}
