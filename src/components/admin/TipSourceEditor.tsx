import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, PencilSimple, Warning, XCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { useSaveTipSource, useTipSourcePreview } from "@/hooks/queries/use-tip-sources";
import { useDebouncedValue } from "@/hooks/tips/use-tips-page";
import { actionToast } from "@/lib/action-toast";
import {
  FIELD_META,
  TEMPLATE_FIELDS,
  cleanTemplate,
  inferRule,
  isUsable,
  markerSpan,
  missingRules,
  ruleMode,
  type FieldRule,
  type RuleMode,
  type TemplateField,
  type TipTemplate,
} from "@/lib/tip-template";
import type { FieldReading, TipSource } from "@/api/routes/tip-sources";
import { cn } from "@/lib/utils";

const MODE_LABEL: Record<RuleMode, string> = {
  after: "Depois do texto",
  line: "Linha nº",
  fixed: "Valor fixo",
  off: "Não tem",
};

type Selection = [number, number];

const EMPTY: TipTemplate = { fields: {} };

/**
 * Cadastro de uma fonte: cola uma mensagem do tipster, marca cada trecho
 * (Casa, Jogo, Odd…) e a regra sai sozinha; o formulário mostra a regra pra
 * ajustar. A leitura ao lado vem do backend, que é quem vai ler as mensagens
 * de verdade — o que aparece aqui é exatamente o que o bot vai fazer.
 */
export function TipSourceEditor({ source }: { source?: TipSource }) {
  const navigate = useNavigate();
  const save = useSaveTipSource();
  const [name, setName] = useState(source?.name ?? "");
  const [isActive, setIsActive] = useState(source?.isActive ?? true);
  const [text, setText] = useState(source?.sampleText ?? "");
  const [template, setTemplate] = useState<TipTemplate>(source?.template ?? EMPTY);
  const [marking, setMarking] = useState(!!source?.sampleText);
  const [focus, setFocus] = useState<TemplateField | null>(null);

  const clean = useMemo(() => cleanTemplate(template), [template]);
  const previewParams = useDebouncedValue(
    useMemo(
      () => (text.trim() ? { text, template: clean, name: name.trim() || undefined, id: source?.id } : null),
      [text, clean, name, source?.id],
    ),
    300,
  );
  const preview = useTipSourcePreview(previewParams);
  const readings = useMemo(
    () => new Map((preview.data?.fields ?? []).map((f) => [f.field, f])),
    [preview.data],
  );

  const missing = missingRules(template);
  const canSave = name.trim().length >= 2 && missing.length === 0 && !save.isPending;

  const setRule = (field: TemplateField, rule: FieldRule | undefined) =>
    setTemplate((t) => ({ ...t, fields: { ...t.fields, [field]: rule } }));

  const handleSave = () => {
    if (!canSave) return;
    save.mutate(
      { id: source?.id, name: name.trim(), template: clean, sampleText: text.trim() ? text : null, isActive },
      {
        onSuccess: () => {
          actionToast.success({ title: source ? "Fonte salva" : "Fonte cadastrada" });
          navigate("/admin/sources");
        },
        onError: (e) => actionToast.error({ description: (e as Error).message }),
      },
    );
  };

  const marks = useMemo(() => {
    const list: Mark[] = [];
    const m = markerSpan(text, template.marker);
    if (m) list.push({ span: m, label: "Identificador", tone: "marker" });
    for (const f of preview.data?.fields ?? []) {
      if (f.span) list.push({ span: f.span, label: FIELD_META[f.field].short, tone: f.error ? "error" : "field", field: f.field });
    }
    return list;
  }, [text, template.marker, preview.data]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1.5 flex-1 max-w-md">
          <label htmlFor="source-name" className="text-[13px] text-zinc-400">
            Nome da fonte
          </label>
          <Input
            id="source-name"
            placeholder="Ex.: Tipster X"
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm min-h-[44px] sm:min-h-[36px] cursor-pointer">
          <Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(v === true)} />
          Ativa
        </label>
        <div className="flex gap-2 sm:ml-auto">
          <Button variant="secondary" onClick={() => navigate("/admin/sources")}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {save.isPending ? "Salvando…" : "Salvar fonte"}
          </Button>
        </div>
      </div>
      {missing.length > 0 && (
        <p className="text-xs text-zinc-500 -mt-2">
          Para salvar, falta dizer onde está: {missing.map((f) => FIELD_META[f].label).join(", ")}.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start">
        <AdminPanel
          eyebrow="1 · Exemplo"
          title="Mensagem do tipster"
          description={
            marking
              ? "Selecione um trecho e escolha o que ele é. A regra aparece ao lado."
              : "Cole uma mensagem como ela chega no grupo Tips."
          }
          actions={
            marking && (
              <Button variant="secondary" size="sm" onClick={() => setMarking(false)}>
                <PencilSimple size={14} /> Trocar mensagem
              </Button>
            )
          }
        >
          {marking ? (
            <MarkingArea
              text={text}
              marks={marks}
              focus={focus}
              template={template}
              onMarkField={(field, [s, e]) => {
                const rule = inferRule(text, s, e, field);
                if (!rule) return actionToast.error({ description: "Selecione um trecho com texto." });
                setRule(field, rule);
              }}
              onMarkIdentifier={([s, e]) => setTemplate((t) => ({ ...t, marker: text.slice(s, e).trim() }))}
            />
          ) : (
            <div className="p-4 sm:p-5 space-y-3">
              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={12}
                placeholder={"🔥 TIP DO DIA 🔥\nJogo: Flamengo x Palmeiras\nMercado: Over 2.5\nOdd: 1,85 na Bet365\nStake 2%"}
                className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm leading-relaxed font-mono placeholder:text-zinc-600 hover:border-foreground/45 focus-visible:outline-none focus-visible:border-accent resize-y"
              />
              <Button onClick={() => setMarking(true)} disabled={!text.trim()}>
                Marcar campos
              </Button>
            </div>
          )}
        </AdminPanel>

        <div className="space-y-5 min-w-0">
          <AdminPanel
            eyebrow="2 · Modelo"
            title="Onde está cada campo"
            description="Marcar no exemplo preenche isto. Ajuste se a regra não servir pras próximas mensagens."
          >
            <div className="divide-y divide-border">
              <MarkerRow
                value={template.marker ?? ""}
                found={preview.data?.markerFound}
                hasText={!!text.trim()}
                onChange={(marker) => setTemplate((t) => ({ ...t, marker }))}
              />
              {TEMPLATE_FIELDS.map((field) => (
                <FieldRow
                  key={field}
                  field={field}
                  rule={template.fields[field]}
                  reading={text.trim() ? readings.get(field) : undefined}
                  onChange={(rule) => setRule(field, rule)}
                  onFocus={setFocus}
                />
              ))}
            </div>
          </AdminPanel>

          <CardPreview
            hasText={!!text.trim()}
            card={preview.data?.card ?? null}
            fields={preview.data?.fields ?? []}
            conflicts={preview.data?.conflicts ?? 0}
            checked={preview.data?.checked ?? 0}
            hasMarker={!!template.marker?.trim()}
            error={preview.isError ? (preview.error as Error).message : null}
          />
        </div>
      </div>
    </div>
  );
}

interface Mark {
  span: [number, number];
  label: string;
  tone: "field" | "error" | "marker";
  field?: TemplateField;
}

// Offsets da seleção dentro do texto. O destaque quebra o texto em vários
// nós, e a etiqueta de cada um é ::after (fora do DOM): contar pelo Range até
// o início da seleção dá a posição no texto original.
function selectionIn(el: HTMLElement): Selection | null | undefined {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return undefined;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.startContainer) || !el.contains(range.endContainer)) return undefined;
  if (sel.isCollapsed) return null;
  const before = document.createRange();
  before.selectNodeContents(el);
  before.setEnd(range.startContainer, range.startOffset);
  const start = before.toString().length;
  return [start, start + range.toString().length];
}

function MarkingArea({
  text,
  marks,
  focus,
  template,
  onMarkField,
  onMarkIdentifier,
}: {
  text: string;
  marks: Mark[];
  focus: TemplateField | null;
  template: TipTemplate;
  onMarkField: (field: TemplateField, sel: Selection) => void;
  onMarkIdentifier: (sel: Selection) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<Selection | null>(null);

  // selectionchange e não mouseup: no celular a seleção vem pelas alças do
  // sistema, sem mouseup. Seleção fora do texto (o clique no botão de campo)
  // não apaga a guardada.
  useEffect(() => {
    const onChange = () => {
      if (!ref.current) return;
      const sel = selectionIn(ref.current);
      if (sel !== undefined) setSelection(sel);
    };
    document.addEventListener("selectionchange", onChange);
    return () => document.removeEventListener("selectionchange", onChange);
  }, []);

  const apply = (fn: (sel: Selection) => void) => {
    if (!selection) return;
    fn(selection);
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  };

  const picked = selection ? text.slice(...selection).trim() : "";

  return (
    <div>
      <div
        ref={ref}
        className="px-4 py-4 sm:px-5 text-[15px] leading-[1.9] whitespace-pre-wrap break-words font-mono selection:bg-accent/35"
      >
        <HighlightedText text={text} marks={marks} focus={focus} />
      </div>

      <div className="border-t border-border px-4 py-3 sm:px-5 space-y-2">
        <p className="text-xs text-zinc-500 min-h-4 truncate">
          {picked ? (
            <>
              Marcar <span className="text-foreground font-medium">“{picked}”</span> como:
            </>
          ) : (
            "Selecione um trecho da mensagem acima."
          )}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_FIELDS.map((field) => (
            <TagButton
              key={field}
              disabled={!selection}
              done={isUsable(template.fields[field])}
              onClick={() => apply((sel) => onMarkField(field, sel))}
            >
              {FIELD_META[field].label}
            </TagButton>
          ))}
          <TagButton
            disabled={!selection}
            done={!!template.marker?.trim()}
            tone="marker"
            onClick={() => apply(onMarkIdentifier)}
          >
            Identificador
          </TagButton>
        </div>
      </div>
    </div>
  );
}

function TagButton({
  disabled,
  done,
  tone = "field",
  onClick,
  children,
}: {
  disabled: boolean;
  done: boolean;
  tone?: "field" | "marker";
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      // Sem isto o clique tira a seleção do texto antes de o botão ver.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "press inline-flex items-center gap-1 h-9 sm:h-8 px-3 rounded-full border text-[13px] transition disabled:opacity-40 disabled:pointer-events-none",
        tone === "marker"
          ? "border-warning/40 text-warning hover:bg-warning/10"
          : "border-accent/35 text-accent-text hover:bg-accent/10",
      )}
    >
      {done && <CheckCircle size={13} weight="fill" />}
      {children}
    </button>
  );
}

function HighlightedText({ text, marks, focus }: { text: string; marks: Mark[]; focus: TemplateField | null }) {
  // Sobreposição: vale o primeiro trecho (o identificador, depois a ordem dos campos).
  const sorted = [...marks].sort((a, b) => a.span[0] - b.span[0]);
  const parts: ReactNode[] = [];
  let at = 0;
  for (const mark of sorted) {
    const [s, e] = mark.span;
    if (s < at) continue;
    if (s > at) parts.push(text.slice(at, s));
    parts.push(
      <span
        key={`${s}-${mark.label}`}
        data-label={mark.label}
        className={cn(
          "rounded-[3px] px-0.5 -mx-0.5 ring-1 transition-shadow",
          "after:content-[attr(data-label)] after:ml-1 after:align-super after:text-[9px] after:font-sans after:font-semibold after:uppercase after:tracking-wider",
          mark.tone === "marker" && "bg-warning/15 ring-warning/40 after:text-warning",
          mark.tone === "field" && "bg-accent/15 ring-accent/35 after:text-accent-text",
          mark.tone === "error" && "bg-danger/10 ring-danger/40 after:text-danger",
          focus && mark.field === focus && "ring-2",
        )}
      >
        {text.slice(s, e)}
      </span>,
    );
    at = e;
  }
  parts.push(text.slice(at));
  return <>{parts}</>;
}

function MarkerRow({
  value,
  found,
  hasText,
  onChange,
}: {
  value: string;
  found: boolean | undefined;
  hasText: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="px-4 py-3 sm:px-5 space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">Identificador</span>
        <span className="text-xs text-zinc-500">opcional</span>
      </div>
      <Input
        value={value}
        maxLength={100}
        placeholder="Texto que toda mensagem desta fonte tem"
        className="font-mono text-sm"
        onChange={(e) => onChange(e.target.value)}
      />
      <p className={cn("text-xs", value.trim() && hasText && found === false ? "text-danger" : "text-zinc-500")}>
        {value.trim() && hasText && found === false
          ? "Não aparece na mensagem de exemplo."
          : "Várias fontes chegam pelo mesmo grupo: é o que impede este modelo de ler a tip de outra."}
      </p>
    </div>
  );
}

function FieldRow({
  field,
  rule,
  reading,
  onChange,
  onFocus,
}: {
  field: TemplateField;
  rule: FieldRule | undefined;
  reading: FieldReading | undefined;
  onChange: (rule: FieldRule | undefined) => void;
  onFocus: (field: TemplateField | null) => void;
}) {
  const meta = FIELD_META[field];
  const mode = ruleMode(rule);
  const r = rule ?? {};

  const setMode = (next: RuleMode) => {
    if (next === "off") return onChange(undefined);
    if (next === "fixed") return onChange({ fixed: r.fixed ?? "" });
    // Entre "depois do texto" e "linha" o texto âncora e o "até" continuam.
    const kept: FieldRule = { after: r.after, until: r.until };
    onChange(next === "line" ? { ...kept, line: r.line ?? 1 } : { ...kept, after: r.after ?? "" });
  };

  const modes: RuleMode[] = meta.required ? ["after", "line", "fixed"] : ["after", "line", "fixed", "off"];
  const inputClass = "font-mono text-sm min-w-0";

  return (
    <div
      className="px-4 py-3 sm:px-5 space-y-2"
      onMouseEnter={() => onFocus(field)}
      onMouseLeave={() => onFocus(null)}
      onFocusCapture={() => onFocus(field)}
      onBlurCapture={() => onFocus(null)}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium w-24 shrink-0">
          {meta.label}
          {!meta.required && <span className="block text-[11px] font-normal text-zinc-500">opcional</span>}
        </span>
        <Select value={mode === "off" && meta.required ? "" : mode} onValueChange={(v) => setMode(v as RuleMode)}>
          <SelectTrigger className="h-9 w-40 shrink-0 text-sm">
            <SelectValue placeholder="Escolha…" />
          </SelectTrigger>
          <SelectContent>
            {modes.map((m) => (
              <SelectItem key={m} value={m}>
                {MODE_LABEL[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ReadingBadge reading={reading} mode={mode} />
      </div>

      {mode !== "off" && (
        <div className="flex flex-wrap gap-2 sm:pl-[108px]">
          {mode === "fixed" && (
            <Input
              className={cn(inputClass, "flex-1")}
              placeholder={meta.example}
              value={r.fixed ?? ""}
              onChange={(e) => onChange({ fixed: e.target.value })}
            />
          )}
          {mode === "line" && (
            <Input
              type="number"
              min={1}
              max={50}
              aria-label="Número da linha"
              className={cn(inputClass, "w-20")}
              value={r.line ?? ""}
              onChange={(e) => {
                const n = Number(e.target.value);
                onChange({ ...r, line: Number.isInteger(n) && n >= 1 ? Math.min(n, 50) : 1 });
              }}
            />
          )}
          {(mode === "after" || mode === "line") && (
            <Input
              className={cn(inputClass, "flex-1 basis-32")}
              placeholder={mode === "line" ? "depois de (opcional)" : "texto antes do valor, ex.: Odd:"}
              value={r.after ?? ""}
              // Em "depois do texto" a chave fica mesmo vazia: é ela que diz o modo.
              onChange={(e) => onChange({ ...r, after: e.target.value || (mode === "after" ? "" : undefined) })}
            />
          )}
          {/* Número: o backend pega o primeiro número, o resto da linha não atrapalha. */}
          {(mode === "after" || mode === "line") && !meta.numeric && (
            <Input
              className={cn(inputClass, "flex-1 basis-28")}
              placeholder="até (opcional)"
              value={r.until ?? ""}
              onChange={(e) => onChange({ ...r, until: e.target.value || undefined })}
            />
          )}
        </div>
      )}
    </div>
  );
}

const formatValue = (v: string | number) =>
  typeof v === "number" ? v.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : v;

function ReadingBadge({ reading, mode }: { reading: FieldReading | undefined; mode: RuleMode }) {
  if (!reading || (mode === "off" && !reading.error)) return <span className="flex-1" />;
  if (reading.error) {
    return (
      <span className="flex-1 min-w-0 flex items-center gap-1 text-xs text-danger">
        <XCircle size={14} className="shrink-0" />
        <span className="truncate">{reading.error}</span>
      </span>
    );
  }
  return (
    <span className="flex-1 min-w-0 flex items-center gap-1 text-xs text-success">
      <CheckCircle size={14} weight="fill" className="shrink-0" />
      <span className="truncate text-foreground/80" title={String(reading.value)}>
        {reading.value !== null ? formatValue(reading.value) : ""}
      </span>
    </span>
  );
}

function CardPreview({
  hasText,
  card,
  fields,
  conflicts,
  checked,
  hasMarker,
  error,
}: {
  hasText: boolean;
  card: string | null;
  fields: FieldReading[];
  conflicts: number;
  checked: number;
  hasMarker: boolean;
  error: string | null;
}) {
  const failing = fields.filter((f) => FIELD_META[f.field].required && f.error);

  return (
    <AdminPanel eyebrow="3 · Resultado" title="O que o usuário recebe">
      <div className="p-4 sm:p-5 space-y-3">
        {error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : !hasText ? (
          <p className="text-sm text-zinc-500">Cole uma mensagem de exemplo para ver o card.</p>
        ) : card ? (
          <pre className="rounded-lg border border-border bg-foreground/[0.03] px-3.5 py-3 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {card}
            <span className="block mt-2 text-zinc-500">{"🎯 Recomendação de aposta: R$ … (banca de cada usuário × %)"}</span>
          </pre>
        ) : (
          <p className="text-sm text-zinc-400">
            O modelo ainda não lê a mensagem inteira
            {failing.length > 0 && <>: falta {failing.map((f) => FIELD_META[f.field].label).join(", ")}</>}.
            Mensagem assim segue no formato padrão, sem tradução.
          </p>
        )}

        {card && conflicts > 0 && (
          <p className="flex gap-2 text-sm text-warning">
            <Warning size={16} className="shrink-0 mt-0.5" />
            <span>
              Este modelo também lê {conflicts} das últimas {checked} tips de outros formatos e passaria a
              traduzi-las como desta fonte.{" "}
              {hasMarker ? "Troque o identificador por um texto que só esta fonte manda." : "Marque um identificador."}
            </span>
          </p>
        )}
        {card && conflicts === 0 && checked > 0 && (
          <p className="text-xs text-zinc-500">Não lê nenhuma das últimas {checked} tips de outros formatos.</p>
        )}
      </div>
    </AdminPanel>
  );
}
