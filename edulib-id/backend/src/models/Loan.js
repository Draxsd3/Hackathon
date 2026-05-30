/**
 * Emprestimo de livro.
 * status: 'active' | 'returned' | 'overdue'
 */
function buildLoan({
  id,
  studentId,
  bookId,
  loanDate,
  dueDate,
  returnDate,
  status = 'active',
  notes,
}) {
  return {
    id,
    studentId,
    bookId,
    loanDate: loanDate || new Date().toISOString(),
    dueDate,
    returnDate: returnDate || null,
    status,
    notes: notes || null,
  };
}

module.exports = { buildLoan };
