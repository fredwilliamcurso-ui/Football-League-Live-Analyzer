import JSZip from 'jszip';
import androidFilesData from './androidProjectFiles.json';

export async function downloadAndroidProjectZip(onProgress?: (msg: string) => void) {
  if (onProgress) onProgress('Preparing Android project structure...');
  
  const zip = new JSZip();

  // Add all files into the zip archive
  for (const [filePath, fileContent] of Object.entries(androidFilesData)) {
    zip.file(filePath, fileContent as string);
  }

  if (onProgress) onProgress('Compiling ZIP archive...');
  
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  if (onProgress) onProgress('Starting download...');

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'Football-League-Live-Analyzer-Android.zip';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10000);
}
