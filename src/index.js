import './css/style.css';
import HelpDesk from './js/HelpDesk.js';
import TicketService from './js/TicketService.js';

const app = new HelpDesk(document.getElementById('root'), new TicketService(__API_URL__));
app.init();
