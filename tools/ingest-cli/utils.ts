import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { EPub } from 'epub-parser';
import { PDFDocument } from 'pdf-lib';
import { supabase } from '../../src/lib/supabase';

export interface BookMetadata {
  title: string;
  author: string;
  language: string;
  year?: number;
  isbn?: string;
  coverBuffer?: Buffer;
}

export async function computeChecksum(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function extractEpubMetadata(filePath: string): Promise<BookMetadata> {
  return new Promise((resolve, reject) => {
    EPub.createAsync(filePath, (err: Error | null, epub: any) => {
      if (err) return reject(err);

      const metadata = epub.metadata;
      const coverPath = epub.manifest.cover?.href;
      let coverBuffer: Buffer | undefined;

      if (coverPath) {
        // Извлекаем обложку из EPUB
        const coverData = epub.zip.readFileSync(coverPath);
        coverBuffer = Buffer.from(coverData);
      }

      resolve({
        title: metadata.title || 'Unknown Title',
        author: metadata.creator || 'Unknown Author',
        language: metadata.language || 'en',
        year: metadata.date ? new Date(metadata.date).getFullYear() : undefined,
        isbn: metadata.identifier?.find((id: any) => id.scheme === 'ISBN'),
        coverBuffer,
      });
    });
  });
}

export async function extractPdfMetadata(filePath: string): Promise<BookMetadata> {
  const pdfBytes = await fs.readFile(filePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const metadata = pdfDoc.getTitle() || 'Unknown Title';

  // Рендерим первую страницу как обложку
  const pages = pdfDoc.getPages();
  if (pages.length > 0) {
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    // Создаем PNG из первой страницы
    const coverBuffer = await sharp({
      create: {
        width: Math.round(width),
        height: Math.round(height),
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([{
        input: await firstPage.render().toBuffer(),
        top: 0,
        left: 0,
      }])
      .jpeg()
      .toBuffer();

    return {
      title: metadata,
      author: pdfDoc.getAuthor() || 'Unknown Author',
      language: pdfDoc.getLanguage() || 'en',
      coverBuffer,
    };
  }

  return {
    title: metadata,
    author: pdfDoc.getAuthor() || 'Unknown Author',
    language: pdfDoc.getLanguage() || 'en',
  };
}

export async function generatePlaceholderCover(title: string, author: string): Promise<Buffer> {
  const width = 400;
  const height = 600;
  
  return await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 240, g: 240, b: 240, alpha: 1 }
    }
  })
    .composite([{
      input: {
        text: {
          text: `${title}\n\nby\n\n${author}`,
          align: 'center',
          font: 'sans-serif',
          fontSize: 32,
        }
      },
      top: height / 2 - 100,
      left: 20,
      right: 20,
    }])
    .jpeg()
    .toBuffer();
}

export async function uploadToSupabase(
  filePath: string,
  checksum: string,
  format: 'epub' | 'pdf',
  metadata: BookMetadata,
): Promise<void> {
  const fileExt = format;
  const fileName = `${checksum}.${fileExt}`;
  const coverName = `${checksum}.jpg`;

  // Загружаем файл книги
  const { error: fileError } = await supabase.storage
    .from('books')
    .upload(fileName, await fs.readFile(filePath));

  if (fileError) throw fileError;

  // Загружаем обложку
  const coverBuffer = metadata.coverBuffer || 
    await generatePlaceholderCover(metadata.title, metadata.author);

  const { error: coverError } = await supabase.storage
    .from('covers')
    .upload(coverName, coverBuffer);

  if (coverError) throw coverError;

  // Получаем публичные URL
  const { data: { publicUrl: coverUrl } } = supabase.storage
    .from('covers')
    .getPublicUrl(coverName);

  // Добавляем запись в базу данных
  const { error: dbError } = await supabase
    .from('books')
    .insert([{
      title: metadata.title,
      author: metadata.author,
      language: metadata.language,
      format,
      cover_url: coverUrl,
      file_path: fileName,
      checksum,
      size_bytes: (await fs.stat(filePath)).size,
      year: metadata.year,
      isbn: metadata.isbn,
    }]);

  if (dbError) throw dbError;
}
