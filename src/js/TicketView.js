const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
});

function actionButton(action, className, text, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.dataset.action = action;
  button.textContent = text;
  button.setAttribute('aria-label', label);
  button.title = label;
  return button;
}

export default class TicketView {
  create(ticket, description) {
    const row = document.createElement('li');
    row.className = `ticket${ticket.status ? ' ticket--done' : ''}`;
    row.dataset.id = ticket.id;

    const status = actionButton('status', 'ticket-status', ticket.status ? '✓' : '',
      `${ticket.status ? 'Вернуть в работу' : 'Отметить выполненной'}: ${ticket.name}`);
    status.setAttribute('aria-pressed', String(ticket.status));

    const body = document.createElement('button');
    body.type = 'button';
    body.className = 'ticket-body';
    body.dataset.action = 'details';
    body.setAttribute('aria-expanded', String(description !== undefined));
    body.setAttribute('aria-controls', `description-${ticket.id}`);
    const name = document.createElement('span');
    name.className = 'ticket-name';
    name.textContent = ticket.name;
    const time = document.createElement('time');
    time.className = 'ticket-date';
    time.dateTime = new Date(ticket.created).toISOString();
    time.textContent = dateFormat.format(ticket.created).replace(',', '');
    body.append(name, time);

    const actions = document.createElement('div');
    actions.className = 'ticket-actions';
    actions.append(
      actionButton('edit', 'icon-button', '✎', `Изменить заявку: ${ticket.name}`),
      actionButton('delete', 'icon-button icon-button--delete', '×', `Удалить заявку: ${ticket.name}`)
    );
    const detail = document.createElement('p');
    detail.className = 'ticket-description';
    detail.id = `description-${ticket.id}`;
    detail.dataset.action = 'details';
    detail.hidden = description === undefined;
    detail.textContent = description || 'Описание отсутствует';
    row.append(status, body, actions, detail);
    return row;
  }

  setDescription(row, description) {
    const detail = row.querySelector('.ticket-description');
    detail.hidden = description === undefined;
    detail.textContent = description || 'Описание отсутствует';
    row.querySelector('.ticket-body').setAttribute('aria-expanded', String(description !== undefined));
  }
}
