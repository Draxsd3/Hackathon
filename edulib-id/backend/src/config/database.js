/**
 * Camada de banco de dados.
 *
 * MVP: store em memoria - apenas para demonstrar o backend funcionando.
 * Na producao, troque por um pool de conexoes (pg, supabase-js, etc.) sem
 * mudar a assinatura dos services.
 */

const store = {
  students: new Map(),
  books: new Map(),
  sessions: new Map(),
  loans: new Map(),
  events: new Map(),
};

function getCollection(name) {
  if (!store[name]) {
    throw new Error(`Colecao desconhecida: ${name}`);
  }
  return store[name];
}

module.exports = { store, getCollection };
