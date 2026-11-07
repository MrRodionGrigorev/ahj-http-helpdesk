import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';

function initialTickets() {
  return [
    { name: 'Поменять краску в принтере, ком. 404', description: 'Принтер HP LJ-1210, картриджи на складе' },
    { name: 'Переустановить Windows, PC-Hall24', description: '' },
    { name: 'Установить обновление KB-31642dv3875', description: 'Вышло критическое обновление для Windows' }
  ].map((ticket) => ({ ...ticket, id: randomUUID(), status: false, created: Date.now() }));
}

function readFields(body, creating = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Передайте объект с данными заявки в формате JSON');
  }

  const fields = {};
  if (creating || Object.hasOwn(body, 'name')) {
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 200) {
      throw new Error('Краткое описание должно содержать от 1 до 200 символов');
    }
    fields.name = body.name.trim();
  }
  if (Object.hasOwn(body, 'description')) {
    if (typeof body.description !== 'string' || body.description.length > 5000) {
      throw new Error('Подробное описание должно быть строкой до 5000 символов');
    }
    fields.description = body.description;
  }
  if (Object.hasOwn(body, 'status')) {
    if (typeof body.status !== 'boolean') {
      throw new Error('Статус должен быть boolean');
    }
    fields.status = body.status;
  }
  if (!creating && Object.keys(fields).length === 0) {
    throw new Error('Передайте хотя бы одно поле для обновления');
  }
  return fields;
}

export function createApp({ tickets = initialTickets() } = {}) {
  const app = express();
  let items = structuredClone(tickets);
  const methods = {
    allTickets: 'GET',
    ticketById: 'GET',
    createTicket: 'POST',
    updateById: 'POST',
    deleteById: 'GET'
  };

  app.disable('x-powered-by');
  app.use(cors());
  app.use((_request, response, next) => {
    response.set('Cache-Control', 'no-store');
    response.set('X-Content-Type-Options', 'nosniff');
    next();
  });
  app.use(express.json({ limit: '64kb' }));

  app.get('/health', (_request, response) => response.json({ status: 'ok' }));

  app.all('/', (request, response) => {
    const { method, id } = request.query;
    if (typeof method !== 'string' || !Object.hasOwn(methods, method)) {
      return response.status(404).json({ message: 'Неизвестный метод API' });
    }
    if (request.method !== methods[method]) {
      return response.set('Allow', methods[method]).status(405).json({ message: 'Недопустимый HTTP-метод' });
    }
    if (method === 'allTickets') {
      return response.json(items.map(({ id: ticketId, name, status, created }) => ({
        id: ticketId,
        name,
        status,
        created
      })));
    }
    if (method === 'createTicket') {
      try {
        const fields = readFields(request.body, true);
        const ticket = {
          id: randomUUID(),
          name: fields.name,
          description: '',
          status: false,
          ...fields,
          created: Date.now()
        };
        items.push(ticket);
        return response.status(201).json(ticket);
      } catch (error) {
        return response.status(400).json({ message: error.message });
      }
    }
    if (typeof id !== 'string' || !id) {
      return response.status(400).json({ message: 'Не указан идентификатор заявки' });
    }

    const ticket = items.find((item) => item.id === id);
    if (!ticket) {
      return response.status(404).json({ message: 'Заявка не найдена' });
    }
    if (method === 'ticketById') {
      return response.json(ticket);
    }
    if (method === 'deleteById') {
      items = items.filter((item) => item.id !== id);
      return response.status(204).end();
    }

    try {
      Object.assign(ticket, readFields(request.body));
      return response.json(items);
    } catch (error) {
      return response.status(400).json({ message: error.message });
    }
  });

  app.use((_request, response) => response.status(404).json({ message: 'Ресурс не найден' }));
  app.use((error, _request, response, _next) => {
    if (error.type === 'entity.parse.failed') {
      return response.status(400).json({ message: 'Некорректный JSON в теле запроса' });
    }
    if (error.type === 'entity.too.large') {
      return response.status(413).json({ message: 'Слишком большой запрос' });
    }
    console.error('Ошибка обработки HTTP-запроса');
    return response.status(500).json({ message: 'Внутренняя ошибка сервера' });
  });

  return app;
}
