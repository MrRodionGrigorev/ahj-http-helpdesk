import { createApp } from './app.js';

const port = Number(process.env.PORT || 7070);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT должен быть целым числом от 1 до 65535');
}

const server = createApp().listen(port, () => {
  console.info(`HelpDesk API: http://localhost:${port}`);
});

server.on('error', (error) => {
  console.error(`Не удалось запустить API: ${error.code}`);
  process.exitCode = 1;
});
