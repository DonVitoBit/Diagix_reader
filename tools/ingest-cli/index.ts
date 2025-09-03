#!/usr/bin/env node
import { Command } from 'commander';
import path from 'path';
import {
  computeChecksum,
  extractEpubMetadata,
  extractPdfMetadata,
  uploadToSupabase,
} from './utils';

const program = new Command();

program
  .name('ingest-cli')
  .description('CLI для загрузки книг в Supabase')
  .version('1.0.0');

program
  .command('epub')
  .description('Загрузить EPUB файл')
  .argument('<file>', 'Путь к EPUB файлу')
  .action(async (file) => {
    try {
      const filePath = path.resolve(file);
      console.log('Обработка EPUB файла:', filePath);

      console.log('Вычисление контрольной суммы...');
      const checksum = await computeChecksum(filePath);

      console.log('Извлечение метаданных...');
      const metadata = await extractEpubMetadata(filePath);

      console.log('Загрузка в Supabase...');
      await uploadToSupabase(filePath, checksum, 'epub', metadata);

      console.log('Готово!');
      console.log({
        title: metadata.title,
        author: metadata.author,
        checksum,
      });
    } catch (error) {
      console.error('Ошибка:', error);
      process.exit(1);
    }
  });

program
  .command('pdf')
  .description('Загрузить PDF файл')
  .argument('<file>', 'Путь к PDF файлу')
  .action(async (file) => {
    try {
      const filePath = path.resolve(file);
      console.log('Обработка PDF файла:', filePath);

      console.log('Вычисление контрольной суммы...');
      const checksum = await computeChecksum(filePath);

      console.log('Извлечение метаданных...');
      const metadata = await extractPdfMetadata(filePath);

      console.log('Загрузка в Supabase...');
      await uploadToSupabase(filePath, checksum, 'pdf', metadata);

      console.log('Готово!');
      console.log({
        title: metadata.title,
        author: metadata.author,
        checksum,
      });
    } catch (error) {
      console.error('Ошибка:', error);
      process.exit(1);
    }
  });

program.parse();
