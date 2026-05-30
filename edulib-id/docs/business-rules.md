# Regras de negocio

## Alunos

- Matricula (`registration`) e unica - tentar cadastrar uma duplicada retorna erro 409.
- Foto e opcional, mas o reconhecimento facial so funciona se houver descritor cadastrado.
- Campos obrigatorios: `name`, `registration`. Demais sao opcionais.

## Acervo

- Cada livro tem `copies` (total) e `available` (disponiveis). `available <= copies`.
- Um livro com `available = 0` aparece na busca mas nao pode ser selecionado para emprestimo.
- Categoria default: "Geral".

## Sessoes (entrada/saida)

- Tipo: `entry` ou `exit`.
- Metodos de identificacao: `face`, `qr`, `manual`.
- Toda sessao gera um evento (`session.entry` ou `session.exit`).
- Nao existe validacao de "ja saiu" - o registro e livre para permitir correcoes.

## Emprestimos

- Prazos sugeridos: 3, 7 (default), 14 ou 21 dias.
- Ao criar, `available` do livro diminui em 1.
- Status iniciais: `active`.
- Ao devolver: `status = returned`, `returnDate` registrado, `available` do livro aumenta.
- Apos `dueDate`, o emprestimo passa para `overdue` (verificacao roda no Dashboard a cada 5s no MVP).
- Tentar emprestar um livro sem copias disponiveis retorna erro.

## Eventos

- Audit log do sistema. Tipos atuais:
  - `student.created`
  - `session.entry`, `session.exit`
  - `loan.created`, `loan.returned`
- Usados pelo Dashboard para mostrar atividade recente.

## Assistente

- Base de conhecimento por palavras-chave (matching simples).
- Resposta padrao em caso de "nao encontrei": orienta o usuario a reformular.
- Sem custos / sem rede - 100% client-side no MVP.
- Plug ponto: substituir `pages/Assistant/knowledge.js` por uma chamada ao backend.
