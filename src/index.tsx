import {
  get_candid,
  jvokahaSmart,
  jvozbaSmart,
  search_selrafsi_from_rafsi2,
  type LujvoAndScore,
} from "@dgck81lnn/jvozba"
import type {} from "@koishijs/plugin-help"
import { decodeHTML } from "entities"
import { Context, Schema, h } from "koishi"

export const name = "lojban"
export const inject = { optional: ["puppeteer"] }
export interface Config {}
export const Config: Schema<Config> = Schema.object({})

const JVOZBA_FLAWS = {
  usesExperimentalRafsi: "experimental-rafsi",
  forbiddenLaLaiDoiCmevla: "forbidden-la-lai-doi",
}

function deflaw(list: LujvoAndScore[], observeFlaws: string[] = []) {
  if (!list.length) return []
  observeFlaws = observeFlaws.slice()
  const results: {
    lujvo: LujvoAndScore
    observeFlaws: string[]
  }[] = [{ lujvo: list[0], observeFlaws }]
  const best = results[0]

  for (const flaw in JVOZBA_FLAWS)
    if (best.lujvo[flaw] && !observeFlaws.includes(flaw)) observeFlaws.push(flaw)

  for (const flaw in JVOZBA_FLAWS) {
    if (best.lujvo[flaw]) {
      const fix = list.filter(l => !l[flaw])
      for (const r of deflaw(fix, observeFlaws)) {
        if (results.some(rr => rr.lujvo.lujvo === r.lujvo.lujvo)) continue
        results.push(r)
      }
    }
  }
  return results
}

export function apply(ctx: Context) {
  ctx.i18n.define("zh-CN", require("./locales/zh.yml"))

  // lujvo
  const cmdLujvo = ctx
    .command("lojban/lujvo <input:rawtext>", {
      checkUnknown: true,
      showWarning: true,
    })
    .option("input", "-- <input:rawtext>", { hidden: true })
  cmdLujvo.action(({ session, options }, input) => {
    input ||= ""
    if (options.input) input += " " + options.input
    if (!input) return session.text(".invalid-input")
    input = input
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[‘’h]/g, "'")
      .replace(/[,.]/g, "")
      .toLowerCase()
    try {
      if (
        input.match(/^['a-gi-pr-vx-z]{6,}$/) &&
        input.match(/[bcdfgj-nprstvxz]/g).length > 2
      ) {
        const result = jvokahaSmart(input)
        const word = result
          .map(p => p.part + (p.experimental ? session.text(".star") : ""))
          .join("-")
        const components = result
          .map(p => p.selrafsi)
          .filter(Boolean)
          .join(" ")
        return (
          `${word} → ${components}` +
          (result.some(p => p.experimental)
            ? "\n" + session.text(".star-experimental-rafsi")
            : "")
        )
      }
      if (input.match(/^-?['a-gi-pr-vx-z]+-?(?:[ ]-?['a-gi-pr-vx-z]+-?)+$/)) {
        const { components, results } = jvozbaSmart(input)
        if (!results.length) return session.text(".no-result")

        const output = [
          ...deflaw(results.filter(r => !r.cmevla)),
          ...deflaw(results.filter(r => r.cmevla)),
        ].map(({ lujvo, observeFlaws }) => {
          let desc = session.text(lujvo.cmevla ? ".best-cmevla" : ".best-brivla")
          if (observeFlaws.length)
            desc = session.text(".jvozba-result-key-paren", [
              desc,
              observeFlaws
                .map(flaw =>
                  session.text(`.${lujvo[flaw] ? "has" : "no"}-${JVOZBA_FLAWS[flaw]}`)
                )
                .join(session.text("general.comma")),
            ])
          return session.text(".jvozba-result-item", [desc, lujvo.lujvo, lujvo.score])
        })

        return `${components.join(" ")}:\n` + output.join("\n")
      }
      if (input.match(/^-?['a-gi-pr-vx-z]+-?$/)) {
        const output = []

        const stripped = input.replace(/-/g, "")
        const selrafsi = search_selrafsi_from_rafsi2(stripped)
        if (selrafsi && selrafsi.selrafsi !== stripped)
          output.push(
            session.text(".rafsi-of", [
              `-${stripped}-`,
              selrafsi.selrafsi,
              session.text(selrafsi.experimental ? ".experimental-rafsi" : ".rafsi"),
            ])
          )

        if (!input.includes("-")) {
          let rafsi: { part: string; experimental: boolean }[]
          try {
            rafsi = get_candid(input, false)
          } catch {}
          if (rafsi) {
            output.push(
              session.text(".rafsi-list", [
                session.text(
                  input.match(/[bcdfgj-nprstvxz]/g).length > 2 ? ".gismu" : ".cmavo"
                ),
                input,
                rafsi
                  .map(r => `-${r.part}-${r.experimental ? session.text(".star") : ""}`)
                  .join(" "),
              ])
            )
            if (rafsi.some(r => r.experimental))
              output.push(session.text(".star-experimental-rafsi"))
          }
        }

        if (output.length) return output.join("\n")
      }
      return session.text(".invalid-input")
    } catch (e) {
      return String(e)
    }
  })

  // jboski
  ctx.inject(["component:html"], ctx => {
    const cmdSisku = ctx.command("lojban/jboski <input:rawtext>", {
      checkArgCount: true,
      checkUnknown: true,
      showWarning: true,
    })
    cmdSisku.action(async ({}, input) => {
      let result = await ctx.http.get(
        `https://vudrux.site/jboski/mirror.php?text=${encodeURIComponent(input)}`,
        { responseType: "text" }
      )
      result = result.replace(/&[0-9A-Za-z]+;/g, ent =>
        ["&lt;", "&gt;", "&quot;", "&amp;"].includes(ent) ? ent : decodeHTML(ent)
      )
      return (
        <html>
          <style>
            {
              /*css*/ `
              body {
                margin: 0.5em;
                font-family: sans-serif;
              }
              #output {
                overflow-wrap: break-word;
                display: inline-block;
                max-width: 32em;
              }
              #output .translationerror {
                border: 1px solid #a88;
                background: #fcc;
                padding: 1rem;
                white-space: pre-wrap;
              }
              #output .small {
                font-size: small;
              }
              #output .sumtiplace {
                color: maroon;
                font-size: small;
              }
              #output .parenmark {
                font-size: xx-small;
              }
              #output .translation {
                color: #00f;
              }`
            }
          </style>
          <div id="output">{h.parse(result)}</div>
        </html>
      )
    })
  })
}
