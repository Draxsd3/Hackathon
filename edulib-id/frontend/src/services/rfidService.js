import { bookService } from './bookService.js';
import { loanService } from './loanService.js';

function normalizeRfid(rfid) {
  return String(rfid || '').replace(/^nfc:/i, '').replace(/:/g, '').trim().toUpperCase();
}

export const rfidService = {
  async findBook(rfid) {
    const rawCode = String(rfid || '').trim();
    const code = normalizeRfid(rfid);
    if (!code) throw new Error('Informe o RFID do livro.');

    const queries = [...new Set([rawCode, code].filter(Boolean))];
    const results = [];
    for (const query of queries) {
      results.push(...(await bookService.list({ search: query })));
    }
    return results.find((book) => normalizeRfid(book.rfid) === code) || null;
  },

  async checkoutBooks({ studentId, rfids }) {
    if (!studentId) throw new Error('Aluno nao identificado.');
    const uniqueRfids = [...new Set((rfids || []).map(normalizeRfid).filter(Boolean))];
    if (!uniqueRfids.length) return [];

    const created = [];
    for (const rfid of uniqueRfids) {
      const book = await this.findBook(rfid);
      if (!book) throw new Error(`RFID ${rfid} nao encontrado no acervo.`);
      if (Number(book.available ?? 0) <= 0) throw new Error(`${book.title} nao esta disponivel.`);
      created.push(await loanService.create({ studentId, bookId: book.id, notes: `rfid:${rfid}` }));
    }
    return created;
  },

  async returnBook(rfid) {
    const book = await this.findBook(rfid);
    if (!book) throw new Error(`RFID ${normalizeRfid(rfid)} nao encontrado no acervo.`);

    const activeLoans = (await loanService.list()).filter(
      (loan) => loan.bookId === book.id && ['active', 'overdue'].includes(loan.status)
    );
    const loan = activeLoans[0];
    if (!loan) throw new Error('Nenhum emprestimo ativo encontrado para este livro.');

    const returned = await loanService.returnLoan(loan.id);
    return { book, loan: returned };
  },
};
