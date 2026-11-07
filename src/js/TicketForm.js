export default class TicketForm {
  constructor({ mode, ticket, onSubmit, fallbackFocus }) {
    this.busy = false;
    this.opener = document.activeElement;
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'ticket-dialog';
    this.dialog.setAttribute('aria-labelledby', 'ticket-dialog-title');
    // Only static markup is inserted here. Ticket text is assigned as text/value below.
    this.dialog.innerHTML = `
      <form class="ticket-form">
        <h2 id="ticket-dialog-title"></h2>
        <div class="ticket-form-fields">
          <label for="ticket-name">Краткое описание</label>
          <input id="ticket-name" name="name" maxlength="200" required autocomplete="off">
          <label for="ticket-description">Подробное описание</label>
          <textarea id="ticket-description" name="description" maxlength="5000" rows="4"></textarea>
        </div>
        <p class="delete-message" hidden>Вы уверены, что хотите удалить тикет? Это действие необратимо.</p>
        <p class="delete-ticket-name" hidden></p>
        <p class="form-error" role="alert" hidden></p>
        <div class="dialog-actions">
          <button class="button" type="button" data-cancel>Отмена</button>
          <button class="button button--primary" type="submit">ОК</button>
        </div>
      </form>`;
    this.form = this.dialog.querySelector('form');
    this.error = this.dialog.querySelector('.form-error');
    this.nameInput = this.form.elements.name;
    this.descriptionInput = this.form.elements.description;
    this.dialog.querySelector('h2').textContent = {
      create: 'Добавить тикет', edit: 'Изменить тикет', delete: 'Удалить тикет'
    }[mode];
    if (mode === 'delete') {
      this.dialog.querySelector('.ticket-form-fields').remove();
      this.dialog.querySelector('.delete-message').hidden = false;
      const title = this.dialog.querySelector('.delete-ticket-name');
      title.hidden = false;
      title.textContent = ticket.name;
      this.dialog.querySelector('[data-cancel]').autofocus = true;
    } else {
      this.nameInput.value = ticket?.name || '';
      this.descriptionInput.value = ticket?.description || '';
    }
    this.dialog.querySelector('[data-cancel]').addEventListener('click', () => this.close());
    this.dialog.addEventListener('cancel', (event) => {
      if (this.busy) event.preventDefault();
    });
    this.dialog.addEventListener('close', () => {
      this.dialog.remove();
      (this.opener?.isConnected ? this.opener : fallbackFocus)?.focus();
    });
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (this.busy) return;
      if (mode === 'delete') {
        onSubmit();
        return;
      }
      const name = this.nameInput.value.trim();
      if (!name) {
        this.showError('Введите краткое описание заявки');
        this.nameInput.focus();
        return;
      }
      onSubmit({ name, description: this.descriptionInput.value });
    });
  }

  open() {
    document.body.append(this.dialog);
    this.dialog.showModal();
  }

  close() { this.dialog.close(); }

  showError(message) {
    this.error.textContent = message;
    this.error.hidden = !message;
  }

  setBusy(busy) {
    this.busy = busy;
    this.form.setAttribute('aria-busy', String(busy));
    this.form.querySelectorAll('button, input, textarea').forEach((element) => { element.disabled = busy; });
    this.form.querySelector('[type="submit"]').textContent = busy ? 'Сохранение…' : 'ОК';
  }
}
