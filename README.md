# EduLib ID

## Biblioteca Autônoma Acadêmica com Reconhecimento Facial, QR Code, RFID e Echo Show

### Problema

As bibliotecas das instituições de ensino ainda dependem de processos manuais para empréstimos e devoluções, dificultando o controle do acervo, a rastreabilidade dos livros e a obtenção de dados sobre o uso da biblioteca pelos alunos.

---

# Solução

A **EduLib ID** é uma biblioteca autônoma que utiliza:

* Reconhecimento facial para identificar alunos;
* QR Code e RFID para identificar livros;
* Echo Show (Alexa) para busca inteligente por voz;
* Dashboard para gestão e análise do uso da biblioteca.

O sistema registra automaticamente:

* Quem entrou;
* Quanto tempo permaneceu na biblioteca;
* Quais livros retirou;
* Quando devolveu;
* Quais disciplinas geram mais interesse.

---

# Tecnologias Utilizadas

## Webcam

Utilizada para:

### Reconhecimento Facial

Identificação do aluno através da biometria facial.

### Leitura de QR Code

Identificação do exemplar físico do livro.

---

## QR Code

Cada exemplar possui um QR Code único.

Exemplo:

* LIVRO-000123 → Fundamentos de Biologia (Exemplar 1)
* LIVRO-000124 → Fundamentos de Biologia (Exemplar 2)

---

## RFID

Versão avançada para:

* Leitura automática de livros na saída;
* Inventário rápido;
* Controle antifurto;
* Identificação sem necessidade de escanear QR Code.

---

## Echo Show (Alexa)

Atua como bibliotecária virtual.

Exemplos:

"Alexa, tenho prova de Biologia. O que devo estudar?"

Resposta:

"Recomendo Fundamentos de Biologia. Está disponível na prateleira B1."

---

# Fluxo do Sistema

## 1. Cadastro Inicial

O aluno realiza apenas uma vez:

* Digita o RA;
* Confirma seus dados;
* Aceita o termo de consentimento;
* Realiza captura facial.

Dados armazenados:

* RA;
* Nome;
* Turma;
* Curso/Série;
* Assinatura facial.

---

## 2. Entrada na Biblioteca

O aluno olha para a câmera.

O sistema:

* Reconhece o rosto;
* Registra horário de entrada;
* Cria uma sessão de biblioteca.

Exemplo:

Sessão #845

* Aluno: João Pedro
* Entrada: 22:14
* Status: Aberta

---

## 3. Busca Inteligente

O aluno pode utilizar a Echo Show para localizar materiais.

Exemplo:

"Tenho prova de Biologia."

Sistema:

* Busca livros relacionados;
* Mostra localização;
* Informa disponibilidade.

---

## 4. Empréstimo de Livro

### Passo 1

Reconhecimento facial do aluno.

### Passo 2

Leitura do QR Code do livro pela webcam.

### Passo 3

Confirmação do empréstimo.

O sistema registra:

* Aluno;
* Livro;
* Data;
* Hora;
* Prazo de devolução.

---

## 5. Saída da Biblioteca

Ao sair:

* O aluno é reconhecido novamente;
* A sessão é encerrada;
* O tempo de permanência é calculado.

Exemplo:

* Entrada: 22:14
* Saída: 22:47
* Permanência: 33 minutos

---

## 6. Devolução

O aluno:

* Escaneia o QR Code do livro;
* O sistema localiza o empréstimo ativo;
* Registra a devolução;
* Atualiza o status para disponível.

---

# Dashboard da Instituição

Indicadores disponíveis:

* Alunos atualmente na biblioteca;
* Tempo médio de permanência;
* Livros emprestados;
* Livros em atraso;
* Disciplinas mais buscadas;
* Turmas mais ativas;
* Livros mais utilizados;
* Histórico de movimentações.

Exemplo:

* Livros emprestados hoje: 42
* Disciplina mais buscada: Biologia
* Turma mais ativa: 2º Ano B

---

# Segurança

A solução utiliza quatro camadas de validação:

### RA

Confirma a identidade acadêmica do aluno.

### Reconhecimento Facial

Confirma que o aluno é realmente quem diz ser.

### QR Code/RFID

Identifica exatamente qual exemplar foi retirado.

### Auditoria

Registra todas as operações realizadas.

---

# Diferenciais

* Empréstimos sem fila;
* Biblioteca autônoma;
* Controle completo do acervo;
* Rastreabilidade dos livros;
* Busca por voz com Alexa;
* Dados pedagógicos para coordenação;
* Controle de permanência dos alunos;
* Integração futura com RFID;
* Experiência moderna e acessível.

---

# MVP para o Hackathon

### Funcionalidades Obrigatórias

* Cadastro com RA;
* Captura facial pela webcam;
* Reconhecimento facial;
* Leitura de QR Code do livro;
* Empréstimo automático;
* Devolução automática;
* Controle de entrada e saída;
* Dashboard básico.

---

# Pitch

A EduLib ID transforma a biblioteca da instituição em um ambiente autônomo e inteligente.

O aluno realiza um único cadastro utilizando RA e reconhecimento facial. A partir desse momento, pode acessar a biblioteca sem filas, buscar livros por voz através da Echo Show e realizar empréstimos utilizando apenas sua identificação facial e o QR Code do livro.

Além de automatizar processos, a solução gera inteligência para a instituição, fornecendo dados sobre uso do acervo, disciplinas mais procuradas, engajamento dos alunos e comportamento dentro da biblioteca.

---

# Frase de Impacto

**"A câmera reconhece o aluno, o QR Code reconhece o livro, a Echo Show orienta o estudo e o dashboard transforma tudo em inteligência para a instituição."**
