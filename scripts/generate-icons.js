/**
 * Script para gerar ícones do PWA
 *
 * Para executar, instale o sharp:
 * npm install sharp --save-dev
 *
 * Em seguida execute:
 * node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Verificar se sharp está instalado
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Por favor, instale o sharp primeiro:');
  console.log('npm install sharp --save-dev');
  console.log('\nOu gere os ícones manualmente usando uma ferramenta online como:');
  console.log('https://realfavicongenerator.net/');
  process.exit(1);
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconDir = path.join(__dirname, '../public/icons');
const svgPath = path.join(iconDir, 'icon.svg');

async function generateIcons() {
  // Verificar se o SVG existe
  if (!fs.existsSync(svgPath)) {
    console.error('icon.svg não encontrado em public/icons/');
    process.exit(1);
  }

  // Criar diretório se não existir
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
  }

  console.log('Gerando ícones...\n');

  for (const size of sizes) {
    const outputPath = path.join(iconDir, `icon-${size}x${size}.png`);

    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`✓ icon-${size}x${size}.png`);
  }

  // Gerar favicon
  const faviconPath = path.join(__dirname, '../public/favicon.ico');
  await sharp(svgPath)
    .resize(32, 32)
    .png()
    .toFile(faviconPath.replace('.ico', '.png'));

  console.log('✓ favicon.png');

  // Gerar apple-touch-icon
  const appleTouchPath = path.join(__dirname, '../public/apple-touch-icon.png');
  await sharp(svgPath)
    .resize(180, 180)
    .png()
    .toFile(appleTouchPath);

  console.log('✓ apple-touch-icon.png');

  console.log('\nÍcones gerados com sucesso!');
  console.log('\nNão esqueça de adicionar ao <head> do layout:');
  console.log('<link rel="apple-touch-icon" href="/apple-touch-icon.png" />');
}

generateIcons().catch(console.error);
