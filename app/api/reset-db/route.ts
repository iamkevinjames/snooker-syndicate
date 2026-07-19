import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function POST() {
  const root = process.cwd();
  const seedPath = path.join(root, "db.seed.json");
  const dbPath = path.join(root, "db.json");

  try {
    const seed = await fs.readFile(seedPath, "utf8");
    await fs.writeFile(dbPath, seed, "utf8");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
