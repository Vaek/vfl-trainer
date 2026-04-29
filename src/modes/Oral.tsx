import { useState } from 'react'
import { ORAL_PROMPTS, OralPromptVariant } from '../lib/oralPrompts'

export default function Oral() {
  const [selected, setSelected] = useState<OralPromptVariant['id']>('strict')
  const [copied, setCopied] = useState(false)

  const variant = ORAL_PROMPTS.find((p) => p.id === selected)!

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(variant.prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select the textarea content
      const ta = document.getElementById('prompt-textarea') as HTMLTextAreaElement | null
      if (ta) {
        ta.select()
      }
    }
  }

  return (
    <div>
      <div className="mb-8">
        <div className="font-mono text-xs tracking-[0.25em] text-muted uppercase mb-2">
          / ústní část /
        </div>
        <h1 className="h-display text-4xl mb-3">Ústní zkouška přes AI</h1>
        <p className="text-muted leading-relaxed max-w-3xl">
          Ústní část se simulovat přímo zde nedá — vyžaduje plynulou konverzaci a ideálně i hlas.
          Místo toho zkopírujte níže uvedený scénář do <strong>ChatGPT</strong> (doporučujeme hlasový
          režim v mobilní aplikaci), <strong>Claude</strong>, <strong>Gemini</strong> nebo jiného AI
          chatu. AI pak povede zkoušku podle stejných pravidel jako ČTÚ.
        </p>
      </div>

      {/* Variant tabs */}
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {ORAL_PROMPTS.map((v) => (
          <button
            key={v.id}
            onClick={() => setSelected(v.id)}
            className={
              'card text-left transition-all ' +
              (v.id === selected
                ? '!border-ink !bg-ink/[0.02] shadow-card-hover'
                : 'card-hover opacity-80 hover:opacity-100')
            }
          >
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted mb-1">
              {v.estimatedMinutes} min
            </div>
            <h3 className="font-display text-xl font-medium mb-1">{v.title}</h3>
            <p className="text-xs text-muted">{v.subtitle}</p>
          </button>
        ))}
      </div>

      {/* Variant detail */}
      <div className="card mb-6">
        <h2 className="h-display text-2xl mb-2">{variant.title}</h2>
        <p className="text-sm text-ink/80 leading-relaxed mb-3">{variant.description}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted font-mono mb-4">
          <span>⏱  {variant.estimatedMinutes} min</span>
          <span>🎯  {variant.bestFor}</span>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <button onClick={handleCopy} className="btn-primary">
            {copied ? '✓ Zkopírováno' : 'Zkopírovat scénář do schránky'}
          </button>
        </div>

        <details className="border-t border-ink/10 pt-4">
          <summary className="cursor-pointer text-sm font-medium hover:text-signal">
            Zobrazit text scénáře
          </summary>
          <textarea
            id="prompt-textarea"
            readOnly
            value={variant.prompt}
            className="w-full mt-3 p-4 rounded-xl border border-ink/10 bg-ink/[0.02] font-mono text-xs leading-relaxed h-96"
          />
        </details>
      </div>

      {/* How to use */}
      <div className="card mb-6">
        <h2 className="h-display text-2xl mb-4">Jak na to</h2>
        <ol className="space-y-3 text-sm leading-relaxed">
          <li className="flex gap-3">
            <span className="font-mono text-muted shrink-0 w-6">01</span>
            <span>
              Otevřete si vaši AI v nové záložce nebo v mobilní aplikaci. Doporučujeme{' '}
              <strong>ChatGPT mobilní aplikaci v hlasovém režimu</strong> (Advanced Voice je nejlepší
              pro vyhodnocování výslovnosti — ale i Standard Voice nebo textový chat fungují).
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-muted shrink-0 w-6">02</span>
            <span>
              Klikněte výše na <strong>„Zkopírovat scénář“</strong> a vložte text jako svou první
              zprávu do chatu.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-muted shrink-0 w-6">03</span>
            <span>
              AI vás pozdraví a začne. V hlasovém režimu mluvte normálně, jako byste mluvili
              s živým komisařem.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-muted shrink-0 w-6">04</span>
            <span>
              Po skončení dostanete hodnocení. <strong>Striktní</strong> varianta dá verdikt prospěl/neprospěl,{' '}
              <strong>trénink</strong> dá průběžnou zpětnou vazbu, <strong>drily</strong> dají souhrn chyb.
            </span>
          </li>
        </ol>
      </div>

      {/* Limitations note */}
      <div className="card !bg-sand/30 !border-sand">
        <h3 className="font-medium mb-2">Co AI nezvládne dokonale</h3>
        <ul className="text-sm text-ink/80 leading-relaxed space-y-1.5 list-disc list-inside">
          <li>Hodnocení výslovnosti je přibližné — skutečný komisař může být přísnější.</li>
          <li>AI občas „vypadne z role“ — pokud začne být příliš mírná, připomeňte jí, že je komisař.</li>
          <li>Tempo ATIS někdy nemá realistickou kadenci — pro skutečný nácvik poslechu doporučujeme i nahrávky reálných ATIS (LKPR: +420 220 378 300).</li>
          <li>
            Tento nástroj <strong>nenahrazuje</strong> přípravu s instruktorem ani test u ČTÚ.
            Berte ho jako tréninkového partnera.
          </li>
        </ul>
      </div>
    </div>
  )
}
