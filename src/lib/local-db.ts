import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "local-db.json");

interface LocalUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

interface LocalDB {
  users: LocalUser[];
}

function read(): LocalDB {
  try {
    if (!fs.existsSync(DB_PATH)) return { users: [] };
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch {
    return { users: [] };
  }
}

function write(db: LocalDB): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function getLocalUsers(): LocalUser[] {
  return read().users;
}

export function addLocalUser(user: LocalUser): void {
  const db = read();
  if (db.users.some((u) => u.email === user.email)) return;
  db.users.push(user);
  write(db);
}

export function localAdminExists(): boolean {
  return read().users.some((u) => u.role === "admin");
}
