import createRequest from './api/createRequest.js';

export default class TicketService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  request(method, { id, data } = {}) {
    const url = new URL(this.baseUrl);
    url.searchParams.set('method', method);
    if (id !== undefined) url.searchParams.set('id', id);
    return createRequest({ url, method: data === undefined ? 'GET' : 'POST', data });
  }

  list() { return this.request('allTickets'); }
  get(id) { return this.request('ticketById', { id }); }
  create(data) { return this.request('createTicket', { data: { ...data, id: null } }); }
  update(id, data) { return this.request('updateById', { id, data }); }
  delete(id) { return this.request('deleteById', { id }); }
}
