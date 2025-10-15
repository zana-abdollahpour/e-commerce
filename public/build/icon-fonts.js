// public/build/icon-fonts.js
import { generateFonts, FontAssetType } from "@twbs/fantasticon";
import { optimize } from "svgo";
import cssnano from "cssnano";
import fs from "fs-extra";
import postcss from "postcss";
import path from "path";
import chalk from "chalk";
import { fileURLToPath } from "url";

// absolute path to this file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
  src: path.resolve(__dirname, "../icons"),
  output: path.resolve(__dirname, "../css"),
  fontName: "clb-icons",
  cssPrefix: "clb",
};

const svgOptimizeOptions = {
  removeViewBox: false,
  removeDimensions: true,
};

const generateFontsOptions = {
  inputDir: config.src,
  outputDir: config.output,
  fontTypes: [FontAssetType.WOFF2],
  assetTypes: ["css"],
  fontsUrl: "./",
  tag: "",
  prefix: config.cssPrefix,
  name: config.fontName,
};

const cleanOutputDirectory = async () => {
  await fs.emptyDir(config.output);
  console.log(chalk.blue(`🧹 Cleaned output directory: ${config.output}`));
};

const optimizeSvgIcons = async (options) => {
  if (!fs.existsSync(config.src)) {
    throw new Error(chalk.red(`❌ Icons directory not found: ${config.src}`));
  }

  const files = fs
    .readdirSync(config.src)
    .filter((f) => f.toLowerCase().endsWith(".svg"));

  if (files.length === 0) {
    console.warn(chalk.yellow(`⚠️ No .svg files found in: ${config.src}`));
    return;
  }

  for (const file of files) {
    const filePath = path.join(config.src, file);
    const data = fs.readFileSync(filePath, "utf8");
    const result = await optimize(data, options);
    fs.writeFileSync(filePath, result.data, "utf8");
  }

  console.log(chalk.green(`✨ Optimized ${files.length} SVG icons.`));
};

const minifyCss = async () => {
  const cssFileName = `${config.fontName}.css`;
  const minifiedCssFileName = `${config.fontName}.min.css`;
  const cssFilePath = path.join(config.output, cssFileName);

  if (!fs.existsSync(cssFilePath)) {
    console.warn(
      chalk.yellow(`⚠️ CSS file not found for minification: ${cssFilePath}`)
    );
    return;
  }

  const css = fs.readFileSync(cssFilePath, "utf8");

  const modifiedCss = css.replace(
    /src: url\(.*?\?[^)]*\)/g,
    `src: url(${config.fontName}.woff2)`
  );

  const result = await postcss([cssnano]).process(modifiedCss, {
    from: undefined,
  });
  fs.writeFileSync(
    path.join(config.output, minifiedCssFileName),
    result.css,
    "utf8"
  );

  try {
    fs.unlinkSync(cssFilePath);
  } catch {}

  console.log(chalk.magenta(`📦 Minified CSS created: ${minifiedCssFileName}`));
};

(async () => {
  console.log(chalk.cyanBright("🚀 Starting icon font build..."));
  await cleanOutputDirectory();
  await optimizeSvgIcons(svgOptimizeOptions);
  console.log(chalk.cyan("⚙️ Generating font..."));
  await generateFonts(generateFontsOptions);
  console.log(chalk.greenBright("✅ Font generated."));
  await minifyCss();
  console.log(
    chalk.bgGreen.black("🎉 Icon font build completed successfully.")
  );
})().catch((error) => {
  console.error(
    chalk.bgRed.white("❌ Build failed:"),
    chalk.red(error.message)
  );
  process.exitCode = 1;
});
