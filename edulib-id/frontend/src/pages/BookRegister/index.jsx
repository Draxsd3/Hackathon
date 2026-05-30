import { useState } from 'react';
import { BookPlus, Save, RotateCcw, Nfc, X, BookOpen } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { Card, CardHeader } from '../../components/common/Card.jsx';
import { Input, Select } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { NfcScanner } from '../../components/nfc/NfcScanner.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { bookService } from '../../services/bookService.js';
import { formatTag } from '../../utils/nfcUtils.js';

const CATEGORIES = ['Geral', 'Literatura Brasileira', 'Ficcao', 'Fantasia', 'Infanto-juvenil', 'Didatico', 'Tecnico'];

const EMPTY = {
  title: '',
  author: '',
  isbn: '',
  category: 'Geral',
  copies: 1,
  nfcTag: '',
};

export default function BookRegisterPage() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);
  const [nfcOpen, setNfcOpen] = useState(false);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Titulo obrigatorio';
    if (!form.author.trim()) e.author = 'Autor obrigatorio';
    if (Number(form.copies) < 1) e.copies = 'Pelo menos 1 copia';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const book = bookService.create({
        ...form,
        copies: Number(form.copies),
        nfcTag: form.nfcTag || null,
      });
      toast.success(`Livro "${book.title}" cadastrado.`);
      setCreated(book);
    } catch (err) {
      toast.error(err.message || 'Erro ao cadastrar livro');
    } finally {
      setSaving(false);
    }
  };

  const onNfcRead = (payload) => {
    setForm((f) => ({ ...f, nfcTag: payload.tag }));
    setNfcOpen(false);
    toast.success('Etiqueta NFC vinculada ao formulario.');
  };

  const reset = () => {
    setForm(EMPTY);
    setErrors({});
    setCreated(null);
  };

  return (
    <div>
      <PageHeader
        icon={BookPlus}
        title="Cadastrar livro"
        subtitle="Adicione um livro ao acervo e vincule a etiqueta NFC do exemplar."
        actions={
          created ? (
            <Button variant="secondary" icon={RotateCcw} onClick={reset}>
              Cadastrar outro
            </Button>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Dados do livro" />
          <form onSubmit={submit} className="grid gap-4">
            <Input
              name="title"
              label="Titulo"
              value={form.title}
              onChange={onChange}
              error={errors.title}
              autoFocus
            />
            <Input
              name="author"
              label="Autor"
              value={form.author}
              onChange={onChange}
              error={errors.author}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="isbn"
                label="ISBN (opcional)"
                value={form.isbn}
                onChange={onChange}
              />
              <Input
                name="copies"
                label="Copias"
                type="number"
                min="1"
                value={form.copies}
                onChange={onChange}
                error={errors.copies}
              />
            </div>
            <Select name="category" label="Categoria" value={form.category} onChange={onChange}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>

            <div>
              <label className="label">Etiqueta NFC</label>
              <div className="flex gap-2">
                <input
                  className="input flex-1 font-mono"
                  name="nfcTag"
                  value={formatTag(form.nfcTag)}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nfcTag: e.target.value.replace(/[^0-9a-fA-F]/g, '') }))
                  }
                  placeholder="Vazio - sera lida pelo botao ao lado"
                />
                <Button
                  type="button"
                  variant={form.nfcTag ? 'secondary' : 'primary'}
                  icon={Nfc}
                  onClick={() => setNfcOpen(true)}
                >
                  {form.nfcTag ? 'Reler' : 'Vincular NFC'}
                </Button>
                {form.nfcTag && (
                  <Button
                    type="button"
                    variant="ghost"
                    icon={X}
                    onClick={() => setForm((f) => ({ ...f, nfcTag: '' }))}
                    aria-label="Remover etiqueta"
                  >
                    Limpar
                  </Button>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Vincular uma etiqueta permite emprestar/devolver esse livro encostando o celular no
                exemplar.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={reset}>
                Limpar
              </Button>
              <Button type="submit" loading={saving} icon={Save}>
                Cadastrar livro
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title={created ? 'Cadastrado' : 'Resumo'} />
          {created ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                <p className="font-semibold text-slate-800">{created.title}</p>
              </div>
              <p className="text-slate-500">{created.author}</p>
              <p className="text-slate-500">
                {created.copies} copia(s) - {created.available} disponivel(is)
              </p>
              {created.nfcTag && (
                <div>
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    NFC
                  </span>
                  <code className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">
                    {formatTag(created.nfcTag)}
                  </code>
                </div>
              )}
            </div>
          ) : (
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-slate-500">Titulo</span>
                <span className="font-medium text-slate-800">{form.title || '-'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Autor</span>
                <span className="font-medium text-slate-800">{form.author || '-'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Categoria</span>
                <span className="font-medium text-slate-800">{form.category}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Copias</span>
                <span className="font-medium text-slate-800">{form.copies}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">NFC</span>
                <span className="font-mono text-xs text-slate-800">
                  {form.nfcTag ? formatTag(form.nfcTag) : 'nao vinculada'}
                </span>
              </li>
            </ul>
          )}
        </Card>
      </div>

      <Modal
        open={nfcOpen}
        onClose={() => setNfcOpen(false)}
        title="Vincular etiqueta NFC"
        footer={
          <Button variant="secondary" onClick={() => setNfcOpen(false)}>
            Cancelar
          </Button>
        }
      >
        <p className="mb-4 text-sm text-slate-600">
          Aproxime a etiqueta NFC do verso do celular. O codigo sera lido e preenchido
          automaticamente.
        </p>
        <NfcScanner active={nfcOpen} onRead={onNfcRead} />
      </Modal>
    </div>
  );
}
