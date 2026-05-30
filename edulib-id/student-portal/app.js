const state = {
  page: 'home',
  scheduleModalOpen: false,
  selectedRoomId: null,
  selectedSlot: null,
};

const studyRooms = [
  {
    id: 'biblioteca',
    name: 'Biblioteca',
    description: 'Sala principal para estudo silencioso e consulta ao acervo.',
    capacity: 20,
    slots: ['08:00 - 09:30', '10:00 - 11:30', '14:00 - 16:00', '19:00 - 21:00'],
  },
  {
    id: 'maker',
    name: 'MAKER',
    description: 'Sala de estudos orientados, projetos e atividades em grupo.',
    capacity: 8,
    slots: ['09:00 - 10:30', '13:30 - 15:00', '16:00 - 17:30'],
  },
];

const events = Array.from({ length: 6 }, (_, index) => ({
  id: `event-${index + 1}`,
  title: 'Mock',
  date: index === 4 ? '28, 29 e 30 de maio' : index === 5 ? '28 de maio' : '29 de maio',
  time: index === 4 ? '19:00 as 22:00' : 'Mock',
}));

const loans = [
  {
    id: 'loan-1',
    title: 'Fundamentos de Biologia',
    code: 'BIO-001-A',
    due: '2026-06-05',
    remaining: 6,
    status: 'Em dia',
    progress: 42,
  },
  {
    id: 'loan-2',
    title: 'Literatura Brasileira Essencial',
    code: 'LIT-107-A',
    due: '2026-06-02',
    remaining: 3,
    status: 'Atenção',
    progress: 70,
  },
];

let reservations = [
  { id: 'res-1', place: 'Biblioteca', date: '03/06/2026', time: '14:00 - 16:00', status: 'Confirmado' },
  { id: 'res-2', place: 'MAKER', date: '06/06/2026', time: '09:00 - 10:30', status: 'Solicitado' },
];

function icon(name) {
  const icons = {
    share: '<svg viewBox="0 0 24 24"><path d="M18 8a3 3 0 1 0-2.83-4H15a3 3 0 0 0 .17 1L8.9 8.62a3 3 0 1 0 0 6.76L15.17 19A3 3 0 1 0 18 16a3 3 0 0 0-1.84.63L9.9 13a3.2 3.2 0 0 0 0-2l6.26-3.63A3 3 0 0 0 18 8Z"/></svg>',
    cap: '<svg viewBox="0 0 24 24"><path d="m2 9 10-5 10 5-10 5-10-5Zm4 3v4c2.5 2.2 9.5 2.2 12 0v-4"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><path d="M7 3v4M17 3v4M4 8h16M5 5h14v15H5z"/></svg>',
    medal: '<svg viewBox="0 0 24 24"><path d="M8 3h8l-2 6h-4L8 3Zm4 6a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z"/></svg>',
    bulb: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 22h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 4H9c0-2 0-3-1-4Z"/></svg>',
    terminal: '<svg viewBox="0 0 24 24"><path d="m4 7 5 5-5 5M11 19h9"/></svg>',
    book: '<svg viewBox="0 0 24 24"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Zm3 0v16"/></svg>',
    logout: '<svg viewBox="0 0 24 24"><path d="M14 8V5H5v14h9v-3M11 12h10m-3-3 3 3-3 3"/></svg>',
    chevron: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>',
    user: '<svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg>',
  };
  return icons[name] || icons.grid;
}

function setPage(page) {
  state.page = page;
  render();
}

function openScheduleModal() {
  state.scheduleModalOpen = true;
  state.selectedRoomId = null;
  state.selectedSlot = null;
  render();
}

function closeScheduleModal() {
  state.scheduleModalOpen = false;
  state.selectedRoomId = null;
  state.selectedSlot = null;
  render();
}

function selectScheduleRoom(roomId) {
  state.selectedRoomId = roomId;
  state.selectedSlot = null;
  render();
}

function selectScheduleSlot(slot) {
  state.selectedSlot = slot;
  render();
}

function confirmSchedule() {
  const selectedRoom = studyRooms.find((room) => room.id === state.selectedRoomId);
  if (!selectedRoom || !state.selectedSlot) return;

  reservations = [
    {
      id: `res-${Date.now()}`,
      place: selectedRoom.name,
      date: '03/06/2026',
      time: state.selectedSlot,
      status: 'Solicitado',
    },
    ...reservations,
  ];
  closeScheduleModal();
}

function menuItem({ id, label, iconName, beta, external, dropdown }) {
  const active = state.page === id;
  return `
    <button class="menu-item ${active ? 'active' : ''}" data-page="${id}">
      <span class="menu-icon">${icon(iconName)}</span>
      <span>${label}</span>
      ${beta ? '<em>beta</em>' : ''}
      ${external ? '<span class="menu-extra">↗</span>' : ''}
      ${dropdown ? `<span class="menu-extra chevron">${icon('chevron')}</span>` : ''}
    </button>
  `;
}

function shell(content) {
  return `
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark">${icon('share')}</span>
        <span>Conecta</span>
      </div>
      <div class="student">
        <span>Olá, Renan!</span>
        <span class="avatar">R</span>
      </div>
    </header>

    <aside class="sidebar">
      <nav>
        ${menuItem({ id: 'home', label: 'Academies', iconName: 'cap', external: true })}
        ${menuItem({ id: 'events', label: 'Eventos', iconName: 'calendar', dropdown: true })}
        ${menuItem({ id: 'extension', label: 'Extensão', iconName: 'medal', dropdown: true })}
        ${menuItem({ id: 'projects', label: 'Projetos', iconName: 'bulb', beta: true, dropdown: true })}
        ${menuItem({ id: 'qte', label: 'QTE', iconName: 'cap', beta: true, dropdown: true })}
        ${menuItem({ id: 'library', label: 'Biblioteca', iconName: 'book' })}
        ${menuItem({ id: 'practice', label: 'Práticas', iconName: 'terminal', beta: true, dropdown: true })}
        ${menuItem({ id: 'exit', label: 'Sair', iconName: 'logout' })}
      </nav>
      <button class="collapse-button" aria-label="Recolher menu">‹</button>
      <div class="fatec-logo">
        <strong>Fatec</strong>
        <span>Registro</span>
      </div>
    </aside>

    <main class="content">
      ${content}
    </main>
  `;
}

function homePage(title = 'Bem-vindo ao Conecta') {
  return `
    <section class="hero">
      <h1>${title}</h1>
      <p>Comunidade e universidade conectados.</p>
    </section>

    <div class="tabs">
      <button class="tab active">${icon('grid')} Para toda comunidade</button>
      <button class="tab">${icon('book')} Eventos internos</button>
    </div>

    <section class="event-grid">
      ${events.map((event, index) => `
        <article class="event-card">
          <div class="poster ${index === 4 ? 'feature' : ''}">
            <span class="fatec">Fatec</span>
            <strong>${index === 4 ? "FTX'26" : 'MOCK'}</strong>
            <p>${event.title}</p>
            <small>${event.date}</small>
            <span class="finished">FINALIZADO</span>
          </div>
          <div class="event-body">
            <h2>${index === 4 ? 'FTX 2026' : 'Mock'}</h2>
            <div class="event-meta">${icon('clock')} <span>${event.date}</span></div>
            <p>mock</p>
          </div>
        </article>
      `).join('')}
    </section>
  `;
}

function libraryPage() {
  const selectedRoom = studyRooms.find((room) => room.id === state.selectedRoomId);

  return `
    <section class="hero compact">
      <h1>Biblioteca</h1>
      <p>Agendamento de estudos, empréstimos e acompanhamento dos seus livros.</p>
    </section>

    <section class="library-metrics">
      <article>
        <span>${icon('calendar')}</span>
        <p>Próximo agendamento</p>
        <strong>03/06 às 14:00</strong>
      </article>
      <article>
        <span>${icon('book')}</span>
        <p>Livros emprestados</p>
        <strong>${loans.length}</strong>
      </article>
      <article>
        <span>${icon('clock')}</span>
        <p>Menor prazo</p>
        <strong>${Math.min(...loans.map((loan) => loan.remaining))} dias</strong>
      </article>
      <article>
        <span>${icon('user')}</span>
        <p>Status</p>
        <strong>Regular</strong>
      </article>
    </section>

    <div class="library-layout">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2>Agendar horário de estudo</h2>
            <p>Escolha uma sala e horario disponivel.</p>
          </div>
          <button class="primary-action" type="button" data-open-schedule>Agendar estudo</button>
        </div>
        <div class="schedule-summary">
          ${studyRooms.map((room) => `
            <article>
              <strong>${room.name}</strong>
              <span>${room.capacity} lugares</span>
              <p>${room.slots.length} horarios disponiveis hoje</p>
            </article>
          `).join('')}
        </div>

        <div class="reservation-list">
          <h3>Meus agendamentos</h3>
          ${reservations.map((reservation) => `
            <div class="reservation">
              <div>
                <strong>${reservation.place}</strong>
                <span>${reservation.date} / ${reservation.time}</span>
              </div>
              <em>${reservation.status}</em>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h2>Livros comigo</h2>
            <p>Acompanhe prazos de devolução e situação dos empréstimos.</p>
          </div>
        </div>
        <div class="loan-list">
          ${loans.map((loan) => `
            <article class="loan-card">
              <div class="loan-top">
                <div>
                  <h3>${loan.title}</h3>
                  <p>${loan.code}</p>
                </div>
                <span class="${loan.status === 'Atenção' ? 'warning' : 'ok'}">${loan.status}</span>
              </div>
              <div class="loan-details">
                <span>Devolver até <strong>${new Date(loan.due).toLocaleDateString('pt-BR')}</strong></span>
                <span><strong>${loan.remaining}</strong> dias restantes</span>
              </div>
            </article>
          `).join('')}
        </div>
      </section>
    </div>

    ${state.scheduleModalOpen ? `
      <div class="modal-backdrop" data-close-schedule>
        <section class="schedule-modal" role="dialog" aria-modal="true" aria-labelledby="schedule-title" data-modal>
          <div class="modal-header">
            <div>
              <h2 id="schedule-title">Novo agendamento</h2>
              <p>Selecione a sala e depois escolha um horario disponivel.</p>
            </div>
            <button class="icon-button" type="button" aria-label="Fechar" data-close-schedule>×</button>
          </div>

          <div class="modal-body">
            <div class="room-options">
              ${studyRooms.map((room) => `
                <button class="room-option ${state.selectedRoomId === room.id ? 'selected' : ''}" type="button" data-room="${room.id}">
                  <span>${room.name}</span>
                </button>
              `).join('')}
            </div>

            ${selectedRoom ? `
              <div class="slot-panel">
                <h3>Horarios disponiveis</h3>
                <div class="slot-grid">
                  ${selectedRoom.slots.map((slot) => `
                    <button class="slot-option ${state.selectedSlot === slot ? 'selected' : ''}" type="button" data-slot="${slot}">
                      ${slot}
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : `
              <div class="empty-slots">
                Escolha uma sala para visualizar os horarios livres.
              </div>
            `}
          </div>

          <div class="modal-footer">
            <button type="button" class="secondary-action" data-close-schedule>Cancelar</button>
            <button type="button" class="primary-action ${state.selectedSlot ? '' : 'disabled'}" data-confirm-schedule ${state.selectedSlot ? '' : 'disabled'}>Solicitar agendamento</button>
          </div>
        </section>
      </div>
    ` : ''}
  `;
}

function render() {
  const pages = {
    home: homePage(),
    events: homePage('Eventos'),
    extension: homePage('Extensão'),
    projects: homePage('Projetos'),
    qte: homePage('QTE'),
    practice: homePage('Práticas'),
    library: libraryPage(),
    exit: homePage('Sair'),
  };

  document.querySelector('#app').innerHTML = shell(pages[state.page] || pages.home);
  document.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => setPage(button.dataset.page));
  });
  document.querySelectorAll('[data-open-schedule]').forEach((button) => {
    button.addEventListener('click', openScheduleModal);
  });
  document.querySelectorAll('[data-close-schedule]').forEach((element) => {
    element.addEventListener('click', (event) => {
      const clickedInsideModal = event.target.closest('[data-modal]');
      const clickedCloseButton = event.target.matches('[data-close-schedule]');
      if (clickedInsideModal && !clickedCloseButton) return;
      closeScheduleModal();
    });
  });
  document.querySelectorAll('[data-room]').forEach((button) => {
    button.addEventListener('click', () => selectScheduleRoom(button.dataset.room));
  });
  document.querySelectorAll('[data-slot]').forEach((button) => {
    button.addEventListener('click', () => selectScheduleSlot(button.dataset.slot));
  });
  document.querySelectorAll('[data-confirm-schedule]').forEach((button) => {
    button.addEventListener('click', confirmSchedule);
  });
}

render();
