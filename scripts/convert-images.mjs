import sharp from "sharp";
import { mkdir, readdir, copyFile, stat } from "node:fs/promises";
import path from "node:path";
async function convertDirectory(directory) {
  for (const entry of await readdir(directory,{withFileTypes:true})) {
    const filename=path.join(directory,entry.name);
    if (entry.isDirectory()) await convertDirectory(filename);
    else if (/\.(png|jpe?g)$/i.test(entry.name)) {
      const output=filename.replace(/\.(png|jpe?g)$/i,".webp");
      await sharp(filename).webp(entry.name.includes("bytefx") ? {lossless:true,effort:6} : {quality:90,effort:6}).toFile(output);
      console.log(`${filename}: ${(await stat(filename)).size} → ${(await stat(output)).size} bytes`);
    }
  }
}
await convertDirectory("aseets");
await mkdir("public/images",{recursive:true});
await copyFile("aseets/bytefx.webp","public/bytefx.webp");
await copyFile("aseets/login-baground/background.webp","public/images/login-background.webp");
