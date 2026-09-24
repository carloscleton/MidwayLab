/**
 * Gerador de Código de Barras Code 128 em formato SVG
 * Produz um código de barras 1D scaneável e compatível com leitores de código de barras.
 */

const CODE128_PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131143", "131341", "114113", "114311", "411113", "411311",
  "113141", "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

/**
 * Converte o texto fornecido em uma sequência de larguras de barras e espaços do Code 128 (Start B)
 */
export function getCode128Bars(text: string): number[] {
  const cleanText = text || "BARCODE";
  const symbolIndices: number[] = [104]; // Start B

  let checksum = 104;
  for (let i = 0; i < cleanText.length; i++) {
    const charCode = cleanText.charCodeAt(i);
    let val = charCode - 32;
    if (val < 0 || val > 95) val = 31; // fallback '?'
    symbolIndices.push(val);
    checksum += val * (i + 1);
  }

  const checksumIndex = checksum % 103;
  symbolIndices.push(checksumIndex);
  symbolIndices.push(106); // Stop pattern

  const widths: number[] = [];
  for (const idx of symbolIndices) {
    const pattern = CODE128_PATTERNS[idx];
    for (let p = 0; p < pattern.length; p++) {
      widths.push(parseInt(pattern[p], 10));
    }
  }

  return widths;
}

/**
 * Retorna uma string de marcação SVG com o Código de Barras Code 128 real
 */
export function generateCode128SvgString(text: string, height: number = 40, moduleWidth: number = 1.6): string {
  const widths = getCode128Bars(text);
  let totalWidth = 0;
  widths.forEach(w => { totalWidth += w * moduleWidth; });

  const quietZone = 10;
  const svgWidth = Math.ceil(totalWidth + quietZone * 2);

  let rects = '';
  let currentX = quietZone;

  for (let i = 0; i < widths.length; i++) {
    const width = widths[i] * moduleWidth;
    const isBar = i % 2 === 0; // Pares = barras pretas, ímpares = espaços brancos
    if (isBar) {
      rects += `<rect x="${currentX.toFixed(2)}" y="0" width="${width.toFixed(2)}" height="${height}" fill="#000000" />`;
    }
    currentX += width;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${height}" width="100%" height="${height}px" preserveAspectRatio="none" style="display:block; margin: 0 auto;">${rects}</svg>`;
}
