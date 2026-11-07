import TicketView from './TicketView.js';
import TicketForm from './TicketForm.js';

export default class HelpDesk {
  constructor(container, ticketService) {
    this.container = container;
    this.service = ticketService;
    this.view = new TicketView();
    this.expanded = new Map();
    this.tickets = [];
    this.busy = false;
  }

  init() {
    this.container.innerHTML = `
      <section class="helpdesk" aria-labelledby="app-title">
        <header class="helpdesk-header">
          <div><p class="eyebrow">Служба поддержки</p><h1 id="app-title">HelpDesk</h1></div>
          <button class="button button--primary add-ticket" type="button">Добавить тикет</button>
        </header>
        <div class="feedback">
          <p class="loading" role="status" hidden><span class="spinner" aria-hidden="true"></span>Загружаем данные…</p>
          <div class="error-banner" role="alert" hidden><span></span><button class="button retry" type="button">Повторить</button></div>
        </div>
        <ul class="ticket-list" aria-label="Заявки"></ul>
        <p class="empty-message" hidden>Заявок пока нет<span>Добавьте первую заявку с помощью кнопки выше.</span></p>
        <p class="help-text">Нажмите на заявку, чтобы посмотреть подробное описание.</p>
      </section>`;
    this.list = this.container.querySelector('.ticket-list');
    this.addButton = this.container.querySelector('.add-ticket');
    this.errorBanner = this.container.querySelector('.error-banner');
    this.loading = this.container.querySelector('.loading');
    this.empty = this.container.querySelector('.empty-message');
    this.addButton.addEventListener('click', () => this.openEditor());
    this.container.querySelector('.retry').addEventListener('click', () => this.run(() => this.load()));
    this.list.addEventListener('click', (event) => this.onAction(event));
    return this.run(() => this.load());
  }

  async load() {
    this.tickets = await this.service.list();
    const ids = new Set(this.tickets.map((ticket) => ticket.id));
    for (const id of this.expanded.keys()) {
      if (!ids.has(id)) this.expanded.delete(id);
    }
    this.list.replaceChildren(...this.tickets.map((ticket) => this.view.create(ticket, this.expanded.get(ticket.id))));
    this.empty.hidden = this.tickets.length !== 0;
  }

  setBusy(busy) {
    this.busy = busy;
    this.loading.hidden = !busy;
    this.list.setAttribute('aria-busy', String(busy));
    this.container.querySelectorAll('button').forEach((button) => { button.disabled = busy; });
  }

  async run(action, form) {
    if (this.busy) return;
    this.errorBanner.hidden = true;
    form?.showError('');
    this.setBusy(true);
    form?.setBusy(true);
    try {
      await action();
    } catch (error) {
      if (form?.dialog.open) {
        form.showError(error.message);
      } else {
        this.errorBanner.querySelector('span').textContent = error.message;
        this.errorBanner.hidden = false;
      }
    } finally {
      this.setBusy(false);
      form?.setBusy(false);
    }
  }

  openEditor(ticket = null) {
    const form = new TicketForm({
      mode: ticket ? 'edit' : 'create', ticket, fallbackFocus: this.addButton,
      onSubmit: (data) => this.run(async () => {
        if (ticket) {
          await this.service.update(ticket.id, data);
          this.expanded.delete(ticket.id);
        } else {
          await this.service.create({ ...data, status: false });
        }
        form.close();
        await this.load();
      }, form)
    });
    form.open();
  }

  openDelete(ticket) {
    const form = new TicketForm({
      mode: 'delete', ticket, fallbackFocus: this.addButton,
      onSubmit: () => this.run(async () => {
        await this.service.delete(ticket.id);
        this.expanded.delete(ticket.id);
        form.close();
        await this.load();
      }, form)
    });
    form.open();
  }

  onAction(event) {
    if (this.busy) return;
    const action = event.target.closest('[data-action]')?.dataset.action;
    const row = event.target.closest('[data-id]');
    if (!action || !row) return;
    const ticket = this.tickets.find((item) => item.id === row.dataset.id);
    if (!ticket) return;
    if (action === 'delete') {
      this.openDelete(ticket);
    } else if (action === 'edit') {
      this.run(async () => this.openEditor(await this.service.get(ticket.id)));
    } else if (action === 'status') {
      this.run(async () => {
        await this.service.update(ticket.id, { status: !ticket.status });
        await this.load();
      });
    } else if (this.expanded.has(ticket.id)) {
      this.expanded.delete(ticket.id);
      this.view.setDescription(row, undefined);
    } else {
      this.run(async () => {
        const fullTicket = await this.service.get(ticket.id);
        this.expanded.set(ticket.id, fullTicket.description || '');
        this.view.setDescription(row, fullTicket.description || '');
      });
    }
  }
}
