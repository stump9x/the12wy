import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import readline from "node:readline";

const envPath = path.resolve("apps/web/.env.local");

function ask(question) {
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => prompt.question(question, (answer) => {
    prompt.close();
    resolve(answer);
  }));
}

function askHidden(question) {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) return ask(question);

  return new Promise((resolve, reject) => {
    let value = "";
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();

    function cleanup() {
      stdin.removeListener("data", onData);
      stdin.setRawMode(wasRaw ?? false);
      stdin.pause();
      process.stdout.write("\n");
    }

    function onData(chunk) {
      for (const character of chunk.toString()) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("Đã hủy."));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (character === "\u007f" || character === "\b") {
          if (value.length) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        if (character >= " ") {
          value += character;
          process.stdout.write("*");
        }
      }
    }

    stdin.on("data", onData);
  });
}

async function main() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Lệnh này cần được chạy trực tiếp trong terminal.");
  }

  if (await fs.stat(envPath).catch(() => null)) {
    const overwrite = (await ask("Đã có tài khoản local. Ghi đè? (y/N) ")).trim().toLowerCase();
    if (overwrite !== "y" && overwrite !== "yes") {
      console.log("Giữ nguyên cấu hình hiện tại.");
      return;
    }
  }

  const username = (await ask("Tên tài khoản: ")).trim();
  if (!/^[\w.-]{3,80}$/u.test(username)) {
    throw new Error("Tên tài khoản cần dài 3–80 ký tự và chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.");
  }

  const password = await askHidden("Mật khẩu (tối thiểu 8 ký tự): ");
  if (password.length < 8 || password.length > 200) throw new Error("Mật khẩu cần dài từ 8 đến 200 ký tự.");
  const confirmation = await askHidden("Nhập lại mật khẩu: ");
  if (password !== confirmation) throw new Error("Hai mật khẩu không khớp.");

  const secret = crypto.randomBytes(48).toString("hex");
  const env = [
    `AUTH_USERNAME=${username}`,
    `AUTH_PASSWORD=${password}`,
    `AUTH_SECRET=${secret}`,
    "AUTH_COOKIE_SECURE=false",
    "",
  ].join("\n");
  await fs.mkdir(path.dirname(envPath), { recursive: true });
  await fs.writeFile(envPath, env, { encoding: "utf8", mode: 0o600 });
  console.log(`Đã tạo tài khoản local trong ${path.relative(process.cwd(), envPath)}.`);
  console.log("Khởi động lại pnpm dev để Next.js tải cấu hình mới.");
}

main().catch((error) => {
  console.error(`Không thể tạo tài khoản: ${error.message}`);
  process.exitCode = 1;
});
