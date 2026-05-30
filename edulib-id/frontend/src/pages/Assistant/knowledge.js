/**
 * Base de conhecimento do assistente.
 *
 * MVP: matching por palavras-chave - 100% offline.
 * Para evoluir: substituir `askAssistant` por uma chamada a um LLM
 * (ex.: rota /assistant no backend que chama a API de IA escolhida).
 */

const ENTRIES = [
  {
    keywords: ['horario', 'horarios', 'aberto', 'funciona', 'abre', 'fecha'],
    answer:
      'A biblioteca funciona de segunda a sexta, das 8h as 17h. No periodo de avaliacoes, o horario pode ser estendido ate as 18h - confirme com a coordenacao.',
  },
  {
    keywords: ['prazo', 'devolucao', 'devolver', 'dias', 'tempo'],
    answer:
      'O prazo padrao de emprestimo e de 7 dias. O bibliotecario pode escolher 3, 7, 14 ou 21 dias na tela de Emprestimo. Apos a data, o emprestimo fica em atraso e bloqueia novos emprestimos para o aluno.',
  },
  {
    keywords: ['multa', 'atraso'],
    answer:
      'O Edulib-ID nao aplica multa em dinheiro. Emprestimos em atraso geram o status "Em atraso" no dashboard e impedem novos emprestimos para o mesmo aluno ate a regularizacao.',
  },
  {
    keywords: ['cadastrar', 'cadastro', 'novo aluno', 'matricular', 'inscrever'],
    answer:
      'Va em "Cadastrar aluno" no menu lateral, preencha nome e matricula (obrigatorios), turma e email (opcionais) e capture a foto. Ao final, o sistema gera um QR Code para impressao.',
  },
  {
    keywords: ['qr', 'qr code', 'qrcode', 'codigo'],
    answer:
      'Cada aluno cadastrado recebe um QR Code unico, que pode ser baixado em PNG. Ele e lido nas paginas de Entrada, Saida, Emprestimo e Devolucao com a webcam.',
  },
  {
    keywords: ['face', 'rosto', 'reconhecimento', 'facial'],
    answer:
      'A camera captura o rosto durante o cadastro e gera um descritor armazenado localmente. Nas telas de Entrada/Saida, o aluno pode escolher "Face" para identificar-se sem precisar de QR.',
  },
  {
    keywords: ['entrada', 'entrar'],
    answer:
      'Na pagina de Entrada, identifique o aluno por busca, QR Code ou face. Escolha o metodo usado e confirme - a sessao de entrada e registrada com data, hora e metodo.',
  },
  {
    keywords: ['saida', 'sair'],
    answer:
      'A pagina de Saida funciona como a de Entrada, mas grava o tipo "exit" na sessao. Use no final da visita para fechar a permanencia do aluno.',
  },
  {
    keywords: ['emprestimo', 'emprestar', 'pegar livro'],
    answer:
      'Em "Emprestimo": identifique o aluno, busque o livro, escolha o prazo (3, 7, 14 ou 21 dias) e confirme. O sistema reduz a quantidade disponivel automaticamente.',
  },
  {
    keywords: ['devolver', 'devolucao', 'entregar livro'],
    answer:
      'Em "Devolucao": identifique o aluno e clique em "Devolver" no livro correspondente. A quantidade disponivel e restaurada e o emprestimo recebe a data de devolucao.',
  },
  {
    keywords: ['dashboard', 'metricas', 'estatisticas', 'numero', 'quantos'],
    answer:
      'O Dashboard mostra total de alunos cadastrados, livros disponiveis, emprestimos ativos, atrasos, entradas/saidas do dia e atividade recente.',
  },
  {
    keywords: ['banco', 'localstorage', 'postgres', 'supabase'],
    answer:
      'O MVP usa localStorage para persistencia. A camada de servicos foi desenhada para que a migracao para PostgreSQL ou Supabase via backend Express seja feita sem alterar paginas e componentes.',
  },
];

const FALLBACK =
  'Nao consegui responder com certeza essa duvida. Tente reformular - posso ajudar com horarios, prazos, cadastro, emprestimos, devolucoes, QR Code, reconhecimento facial e dashboard.';

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function askAssistant(text) {
  const q = normalize(text);
  let best = null;
  let bestScore = 0;
  for (const entry of ENTRIES) {
    const score = entry.keywords.reduce((acc, kw) => acc + (q.includes(normalize(kw)) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return best ? best.answer : FALLBACK;
}
