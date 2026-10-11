"use client";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import Turnstile from "@/components/Turnstile";

function CopyButton({ text, labels }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1400);
    } catch {
      setDone(false);
    }
  }
  return (
    <button type="button" className={`agent-copy mono ${done ? "is-done" : ""}`} onClick={copy} aria-label={`${labels.copy}: ${text}`}>
      {done ? labels.copied : labels.copy}
    </button>
  );
}

const UNLOCK_KEY = "agent-skills-unlocked";
const UNLOCK_EVENT = "agent-skills-unlock";
let unlockedThisVisit = false; // fallback when storage is blocked

function subscribeUnlock(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener(UNLOCK_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(UNLOCK_EVENT, callback);
  };
}

function readUnlock() {
  try {
    return unlockedThisVisit || localStorage.getItem(UNLOCK_KEY) === "1";
  } catch {
    return unlockedThisVisit;
  }
}

function EmailGate({ copy, lang, onUnlock, sitekey }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle");
  const [captcha, setCaptcha] = useState("");
  const [reset, setReset] = useState(0);
  async function submit(event) {
    event.preventDefault();
    setState("sending");
    try {
      const form = new FormData(event.currentTarget);
      const res = await fetch("/api/skills-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang, captcha, website: form.get("website") || "" }),
      });
      if (res.ok) return onUnlock(email);
      const data = await res.json().catch(() => ({}));
      setState(data.error === "invalid_email" ? "invalid" : data.error === "rate_limited" ? "limited" : data.error === "captcha_failed" ? "captcha" : "error");
      setCaptcha("");
      setReset((n) => n + 1); // a Turnstile token is single-use
    } catch {
      setState("error");
    }
  }
  const message = { invalid: copy.gateInvalid, limited: copy.gateLimited, error: copy.gateError, captcha: copy.gateCaptcha }[state];
  return (
    <div className="agent-gate-card" role="dialog" aria-labelledby="agent-gate-title">
      <p className="mono">{copy.gateTag}</p>
      <h3 id="agent-gate-title">{copy.gateTitle}</h3>
      <p>{copy.gateText}</p>
      <form onSubmit={submit} noValidate>
        <label className="visually-hidden" htmlFor="agent-gate-email">{copy.gateLabel}</label>
        <input id="agent-gate-email" type="email" inputMode="email" autoComplete="email" required placeholder={copy.gatePlaceholder} value={email} onChange={(e) => { setEmail(e.target.value); if (state !== "sending") setState("idle"); }} />
        <input className="agent-gate-trap" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <button type="submit" disabled={state === "sending" || !email.trim() || !captcha}>{state === "sending" ? copy.gateSending : copy.gateButton}</button>
      </form>
      {sitekey
        ? <Turnstile className="agent-gate-captcha" sitekey={sitekey} action="skills_unlock" theme="light" lang={lang} reset={reset} onToken={setCaptcha} onError={() => setState("captcha")} />
        : <p className="agent-gate-note is-error">{copy.gateError}</p>}
      <p className={`agent-gate-note ${message ? "is-error" : ""}`} aria-live="polite">{message || copy.gateNote}</p>
    </div>
  );
}

export default function AgentSkills({ data, captchaSitekey }) {
  const { t, lang } = useLanguage();
  const copy = t.agentSkills;
  const [query, setQuery] = useState("");
  const unlocked = useSyncExternalStore(subscribeUnlock, readUnlock, () => false);

  function unlock() {
    unlockedThisVisit = true;
    try { localStorage.setItem(UNLOCK_KEY, "1"); } catch {}
    window.dispatchEvent(new Event(UNLOCK_EVENT));
  }
  const search = useRef(null);
  const repoCommand = `npx skills add ${data.repo}`;

  useEffect(() => {
    function onKey(event) {
      const typing = /input|textarea|select/i.test(event.target.tagName) || event.target.isContentEditable;
      if (event.key === "/" && !typing) {
        event.preventDefault();
        search.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.skills
      .map((skill, index) => ({ ...skill, rank: index + 1 }))
      .filter((skill) => !q || `${skill.name} ${skill.description}`.toLowerCase().includes(q));
  }, [data.skills, query]);

  const updated = data.updatedAt
    ? new Intl.DateTimeFormat(lang === "pt" ? "pt-BR" : "en-US", { day: "numeric", month: "short", year: "numeric" }).format(new Date(data.updatedAt))
    : null;

  return (
    <section id="skills" className="document-section" aria-labelledby="agent-skills-heading">
      <div className="wrap">
        <header className="section-header" id="crawl-agent-skills-context" data-crawl-id="agent-skills-context" data-crawl-kind="text" data-crawl-record="context:agent-skills" data-crawl-name={copy.title} data-crawl-field="introduction">
          <p className="mono">{copy.tag}</p>
          <h2 id="agent-skills-heading">{copy.title}</h2>
          <p>{copy.intro}</p>
        </header>

        <div className={`agent-gate ${unlocked ? "is-open" : "is-locked"}`}>
        {!unlocked && <EmailGate copy={copy} lang={lang} onUnlock={unlock} sitekey={captchaSitekey} />}
        <div className="agent-gated" inert={!unlocked} aria-hidden={!unlocked}>
        <div className="agent-install">
          <code><span aria-hidden="true">$</span> {repoCommand}</code>
          <CopyButton text={repoCommand} labels={copy} />
        </div>
        <p className="agent-meta mono">
          <span>{data.skills.length} {data.skills.length === 1 ? copy.skillOne : copy.skillMany}</span>
          {data.stars != null && <span>★ {data.stars}</span>}
          {updated && <span>{copy.updated} {updated}</span>}
          <a href={data.url} target="_blank" rel="noopener noreferrer">{data.repo} ↗</a>
        </p>

        <div className="agent-board">
          <div className="agent-board-top">
            <label className="agent-search">
              <span className="visually-hidden">{copy.searchLabel}</span>
              <input ref={search} id="agent-skills-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={copy.search} autoComplete="off" />
              <kbd aria-hidden="true">/</kbd>
            </label>
          </div>

          <div className="agent-head mono" aria-hidden="true">
            <span>#</span>
            <span>{copy.colSkill}</span>
            <span>{copy.colInstall}</span>
          </div>

          <ol className="agent-list">
            {visible.map((skill) => {
              const cmd = `npx skills add ${data.repo} --skill ${skill.name}`;
              return (
                <li className="agent-row" key={skill.folder} data-crawl-record={`agent_skill:${skill.folder}`} data-crawl-name={skill.name}>
                  <span className="agent-rank mono">{String(skill.rank).padStart(2, "0")}</span>
                  <div className="agent-copy-block" id={`crawl-agent-skill-${skill.folder}`} data-crawl-id={`agent-skill-${skill.folder}`} data-crawl-kind="text">
                    <div className="agent-title-line">
                      <h3><a href={skill.url} target="_blank" rel="noopener noreferrer">{skill.name}</a></h3>
                      <span className="agent-path mono">{data.repo}/{skill.folder}</span>
                    </div>
                    {skill.description && <p>{skill.description}</p>}
                    <span className="agent-files mono">{skill.files} {copy.files}</span>
                  </div>
                  <div className="agent-actions">
                    <CopyButton text={cmd} labels={copy} />
                    <a className="agent-open" href={skill.url} target="_blank" rel="noopener noreferrer">{copy.view} ↗</a>
                  </div>
                </li>
              );
            })}
          </ol>

          {visible.length === 0 && (
            <p className="agent-empty">
              {data.ok ? copy.noMatch : copy.offline} <a className="text-link" href={data.url} target="_blank" rel="noopener noreferrer">{data.repo} ↗</a>
            </p>
          )}
        </div>
        </div>
        </div>
      </div>
    </section>
  );
}
