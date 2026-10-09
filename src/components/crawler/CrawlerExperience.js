"use client";

import dynamic from "next/dynamic";
import VisitorPresence from "../pet/VisitorPresence";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useTransform, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { commitEvidence, createCollection, finalizeCollection, scopeTargets, readTarget } from "@/lib/crawler/collection.mjs";
import { animateElement, cameraTo, cancelled, sleep, visualCopy } from "@/lib/crawler/motion.mjs";
import { captureTiming } from "@/lib/crawler/pace.mjs";
import { crawlerGeometry } from "@/lib/crawler/geometry.mjs";
import { collectionLane, collectionStation, travelDuration } from "@/lib/crawler/route.mjs";
import { captureReaction } from "@/lib/crawler/personality.mjs";
import CollectionDelivery from "./CollectionDelivery";
import ScopePicker from "./ScopePicker";
import PauseProtest from "./PauseProtest";
import CrawlerArtwork from "../CrawlerArtwork";
import PetMenu from "../pet/PetMenu";
import PetPerformance from "../pet/PetPerformance";
import {usePetInteraction} from "../pet/usePetInteraction";
import "./crawler.css";

const PetArcade = dynamic(()=>import("../pet/PetArcade"),{ssr:false});
const VisitorMap = dynamic(()=>import("../pet/VisitorMap"),{ssr:false});
const Context = createContext(null);
export const useCrawler = () => useContext(Context);
const TEXT = {
  pt: { invite: "Veja este site virar dados", hint: "Você escolhe o conteúdo. Ele faz a coleta.", choose: "Ou escolha o primeiro trecho", begin: "Indo buscar sua seleção.", scan: "Encontrei este trecho.", lift: "O original fica. A cópia vem comigo.", saved: "Mais um pedaço guardado.", returning: "Pronto. Vamos abrir a coleta lá em cima.", open: "Ver a coleta", pause: "Pausar", resume: "Continuar", select: "Escolher trecho", selecting: "Escolha um trecho destacado. Esc para sair.", paused: "Parei aqui. Você conduz.", end: "Encerrar", title: "A página, em dados.", summary: "Resumo", json: "JSON", source: "Origem do fragmento", viewSource: "Ver na página", back: "Voltar à coleta", copy: "Copiar JSON", copied: "JSON copiado", download: "Baixar JSON", pdf: "Baixar PDF", pdfBusy: "Gerando PDF…", close: "Fechar", collected: "fragmentos guardados", records: "registros", partial: "coleta parcial", new: "Nova coleta", original: "Como está publicado", stored: "O conteúdo continua na página. A coleta pertence a esta aba.", empty: "Nenhum fragmento confirmado ainda.", image: "Imagem", text: "Texto", quote: "Frase", project: "Projeto", technology: "Tecnologia", failure: "Não foi possível concluir este trecho.", copyFailure: "Copiar não está disponível. Você pode baixar o JSON.", pdfFailure: "Não foi possível gerar o PDF. O JSON continua disponível." },
  en: { invite: "Watch this page turn into data", hint: "You choose the content. It does the collecting.", choose: "Or choose the first fragment", begin: "Going to collect your selection.", scan: "Found this fragment.", lift: "The original stays. The copy comes with me.", saved: "Another piece saved.", returning: "Ready. Let's open the collection at the top.", open: "View collection", pause: "Pause", resume: "Continue", select: "Choose a fragment", selecting: "Choose a highlighted fragment. Esc to leave.", paused: "Paused here. You are in control.", end: "End tour", title: "The page, as data.", summary: "Summary", json: "JSON", source: "Fragment source", viewSource: "View on page", back: "Back to collection", copy: "Copy JSON", copied: "JSON copied", download: "Download JSON", pdf: "Download PDF", pdfBusy: "Creating PDF…", close: "Close", collected: "saved fragments", records: "records", partial: "partial collection", new: "New collection", original: "As published", stored: "The content stays on the page. This collection lives in this tab.", empty: "No confirmed fragments yet.", image: "Image", text: "Text", quote: "Quote", project: "Project", technology: "Technology", failure: "Could not complete this fragment.", copyFailure: "Copy is unavailable. You can download the JSON.", pdfFailure: "Could not create the PDF. JSON is still available." },
};

Object.assign(TEXT.pt, {record:"registro",collectedOne:"fragmento guardado",extractLabel:"EXTRAÇÃO",scopeTitle:"O que vamos extrair?",scopeHint:"Escolha. O tamagotchi cuida do resto.",resumeScope:"Currículo inteiro",experiencesScope:"Experiências",projectsScope:"Projetos",skillsScope:"Ferramentas",resumeDetail:"Tudo que está publicado: apresentação, experiências completas, projetos, tecnologias, serviços e contato.",experiencesDetail:"Todas as empresas, cargos, períodos, métricas e atividades. Os detalhes também vêm.",projectsDetail:"Todos os projetos, com descrição, tecnologias e links.",skillsDetail:"Todas as tecnologias, organizadas pelos grupos do site.",companyChoice:"Só uma empresa?",fragments:"fragmentos",autoPace:"ritmo automático",scopeStartHint:"Clique na opção para começar.",pointFragment:"Apontar um trecho na página",complete:"currículo completo",selectedComplete:"seleção completa",employment:"Cargo e período",chapter:"Experiência em detalhe",list:"Métricas",statistics:"Números em contexto",technology_group:"Tecnologias",service:"Serviço",links:"Links",contact:"Contato"});
Object.assign(TEXT.en, {record:"record",collectedOne:"saved fragment",extractLabel:"EXTRACTION",scopeTitle:"What shall we extract?",scopeHint:"You choose. The tamagotchi takes it from here.",resumeScope:"Full résumé",experiencesScope:"Experience",projectsScope:"Projects",skillsScope:"Tools",resumeDetail:"Everything published: introduction, complete experience, projects, technologies, services and contact.",experiencesDetail:"Every company, role, period, metric and activity. The details come along too.",projectsDetail:"Every project, with descriptions, technologies and links.",skillsDetail:"Every technology, organized by the site's groups.",companyChoice:"Just one company?",fragments:"fragments",autoPace:"automatic pace",scopeStartHint:"Click an option to start.",pointFragment:"Point to a fragment on the page",complete:"complete résumé",selectedComplete:"complete selection",employment:"Role and period",chapter:"Experience in detail",list:"Metrics",statistics:"Numbers in context",technology_group:"Technologies",service:"Service",links:"Links",contact:"Contact"});

function geometry() {
  return crawlerGeometry(window.innerWidth, window.visualViewport?.height || window.innerHeight);
}

function targetNode(id) { return document.querySelector(`main [data-crawl-id="${CSS.escape(id)}"]`); }

export default function CrawlerExperienceProvider({ children }) {
  const { lang } = useLanguage(); const words = TEXT[lang];
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState("idle"), [collection, setCollection] = useState(null), [message, setMessage] = useState("");
  const [highlight, setHighlight] = useState(null), [fragment, setFragment] = useState(null), [selecting, setSelecting] = useState(false);
  const [isOpen, setIsOpen] = useState(false), [layout, setLayout] = useState(null);
  const [notice, setNotice] = useState("");
  const [protest,setProtest]=useState(null),[onStrike,setOnStrike]=useState(false);
  const interruptions=useRef(0),interruptionGrace=useRef(0);
  const strikeMessage=lang==='pt'?'Tô de greve. Só volto depois de um refresh.':'On strike. Refresh if you want me back.';
  const [petMenu, setPetMenu] = useState(null);
  const [petPanel,setPetPanel]=useState(null),[mapLoaded,setMapLoaded]=useState(false),[arcadeLoaded,setArcadeLoaded]=useState(false);
  const closePetPanel=useCallback(()=>{setPetPanel(null);menuTrigger.current?.focus({preventScroll:true});},[]);
  const menuTrigger = useRef(null);
  const closePetMenu = useCallback(()=>{setPetMenu(null);menuTrigger.current?.focus({preventScroll:true});},[]);
  const [station, setStation] = useState({lane:"rail",x:0});
  const [pickerOpen, setPickerOpen] = useState(false), [scopeOptions, setScopeOptions] = useState([]), [companyOptions, setCompanyOptions] = useState([]);
  const x = useMotionValue(0), y = useMotionValue(0);
  const cargoLeft = useTransform(x, value => {
    if(typeof window === "undefined") return 0;
    const edge = !layout?.mobile && window.innerWidth>980 ? 276 : 12;
    return `${Math.max(edge-value,Math.min((layout?.pet||122)/2-101,window.innerWidth-214-value))}px`;
  });
  const speechLeft = useTransform(x,value => typeof window === "undefined" ? "0px" : `${Math.max(12-value,Math.min((layout?.pet||122)/2-105,window.innerWidth-222-value))}px`);
  const copyRef = useRef(null), control = useRef(null), store = useRef(null), phaseRef = useRef("idle"), actions = useRef({});
  const trigger = useRef(null), mounted = useRef(true), sourceControl = useRef(null);
  const busy = !["idle", "paused", "ready", "source", "result", "sulking"].includes(phase);
  const stage = useCallback((value) => { phaseRef.current = value; setPhase(value); }, []);
  const publish = useCallback((value) => { store.current = value; setCollection(value); }, []);

  const move = useCallback(async (nextX, nextY, duration, signal) => {
    if (signal?.aborted) throw cancelled();
    const seconds = travelDuration({x:x.get(),y:y.get()},{x:nextX,y:nextY},duration);
    const distance = Math.abs(nextX-x.get());
    const bend = distance > 120 ? Math.min(22,distance*.035) : 0;
    const ax = animate(x, nextX, { duration: reduced ? 0 : seconds, ease: [.4,0,.2,1] });
    const ay = animate(y, bend ? [y.get(),Math.max(70,(y.get()+nextY)/2-bend),nextY] : nextY, { duration: reduced ? 0 : seconds, ease: [.4,0,.2,1] });
    const abort = () => { ax.stop(); ay.stop(); };
    signal?.addEventListener("abort", abort, { once: true });
    await Promise.all([ax, ay]); signal?.removeEventListener("abort", abort);
    if (signal?.aborted) throw cancelled();
  }, [reduced, x, y]);

  async function reveal(signal) {
    setStation({lane:"rail",x:window.innerWidth-160});
    stage("returning"); setMessage(words.returning); setHighlight(null); setFragment(null);
    await cameraTo(0, reduced ? 0 : Math.min(1400, 400 + window.scrollY * .055), signal);
    const g = geometry(); setLayout(g);
    const nextX = g.mobile ? window.innerWidth - g.pet - 24 : Math.min(window.innerWidth - g.pet - 18, g.left + g.width + 12);
    const nextY = g.mobile ? Math.max(150, g.top + g.height - 135) : Math.max(100, g.top + g.height - 315);
    await move(nextX, nextY, .48, signal);
    stage("revealing"); setMessage(words.open);
    await sleep(reduced ? 100 : 300, signal);
    setIsOpen(true); stage("result");
  }

  async function run(runState) {
    const signal = runState.abort.signal;
    try {
      await sleep(130, signal); // Let the reserved rail settle before measuring a source.
      while (runState.index < runState.ids.length) {
        if (signal.aborted || control.current !== runState) throw cancelled();
        const id = runState.ids[runState.index]; const node = targetNode(id);
        const timing = captureTiming(runState.ids.length, runState.index);
        if (!node) {
          publish({ ...store.current, warnings: [...store.current.warnings, { target_id: id, message: "Target unavailable" }], coverage: { ...store.current.coverage, failed_ids: [...store.current.coverage.failed_ids, id] } });
          runState.index++; continue;
        }
        stage("approaching"); setMessage(`${runState.index + 1}/${runState.ids.length} · ${node.closest("[data-crawl-record]")?.querySelector("h3")?.textContent || node.textContent.slice(0, 40)}`);
        const before = node.getBoundingClientRect();
        const viewport = geometry();
        const field = collectionLane(runState.index) !== "rail";
        const safeTop = viewport.compact ? 38 : window.innerHeight * (viewport.mobile ? .23 : field ? .57 : .28);
        const needsCamera = before.top < safeTop - 40 || before.top + Math.min(before.height, window.innerHeight * .35) > window.innerHeight * (viewport.mobile ? .5 : .8);
        if (needsCamera) await cameraTo(window.scrollY + before.top - safeTop, reduced ? 0 : timing.camera, signal);
        if (node.tagName === "IMG" && !node.complete) await Promise.race([node.decode().catch(() => {}), sleep(1400, signal)]);
        const rect = node.getBoundingClientRect(); const g = geometry(); setLayout(g);
        const destination = collectionStation(rect,runState.index,{...g,width:window.innerWidth,height:window.innerHeight});
        setStation(destination);
        await move(destination.x,destination.y,timing.move,signal);
        const snapshot = readTarget(node);
        stage("inspecting"); setMessage(words.scan); setHighlight({ left: rect.left - 7, top: rect.top - 6, width: rect.width + 14, height: rect.height + 12 });
        await sleep(reduced ? 18 : timing.scan, signal);
        if (snapshot.quality.status === "empty") throw new Error("Empty source");
        const html = visualCopy(node);
        setFragment({ html, rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height } });
        stage("lifting"); setMessage(captureReaction(snapshot,lang)); await sleep(reduced ? 18 : timing.frame, signal);
        if (!reduced) {
          await animateElement(copyRef.current, [{ transform: "translate(0, 0) rotate(0deg)", opacity: .25 }, { transform: "translate(-7px, -18px) rotate(-1deg)", opacity: 1 }], { duration: timing.lift, easing: "cubic-bezier(.2,.8,.2,1)" }, signal);
          await sleep(timing.hold, signal);
          stage("encoding");
          const screenX = x.get() + g.pet * .46, screenY = y.get() + g.pet * .49;
          const dx = screenX - rect.left - rect.width * .03, dy = screenY - rect.top - rect.height * .03;
          await animateElement(copyRef.current, [{ transform: "translate(-7px, -18px) rotate(-1deg)", opacity: 1 }, { offset: .55, transform: `translate(${dx * .65}px, ${dy * .65}px) scale(.45) rotate(-3deg)`, opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(.06) rotate(0deg)`, opacity: 0 }], { duration: timing.encode, easing: "cubic-bezier(.5,0,.8,.3)" }, signal);
        } else await sleep(18, signal);
        if (readTarget(node).source.snapshot_revision !== snapshot.source.snapshot_revision) throw new Error("Source changed during capture");
        publish(commitEvidence(store.current, snapshot));
        runState.index++;
        setFragment(null); stage("confirming"); setMessage(words.saved);
        await sleep(reduced ? 18 : timing.confirm, signal); setHighlight(null);
        await sleep(reduced ? 18 : timing.gap, signal);
      }
      const final = finalizeCollection(store.current);
      publish(final);
      await reveal(signal);
    } catch (error) {
      if (control.current !== runState) return;
      setFragment(null); setHighlight(null);
      if (error.name !== "AbortError" && mounted.current) { stage("paused"); setMessage(words.failure); setNotice(error.message === "Empty source" ? (lang === "pt" ? "Este campo veio vazio. Escolha outro trecho." : "This field is empty. Choose another fragment.") : words.failure); }
    }
  }

  function start(ids = scopeTargets(document, "resume"), scope = "resume") {
    if (interruptions.current>=3 || !["idle", "ready"].includes(phaseRef.current)) return;
    trigger.current = document.activeElement;
    control.current?.abort.abort();
    const original = document.querySelector(".crawler-pet")?.getBoundingClientRect();
    x.set(original?.left || window.innerWidth - 150); y.set(original?.top || window.innerHeight - 150);
    const g = geometry(); setLayout(g);
    const next = createCollection({ url: `${window.location.origin}${window.location.pathname}`, title: document.title, language: lang }, ids, scope, scopeTargets(document, "resume"));
    publish(next); setPickerOpen(false); setNotice(""); setSelecting(false); setFragment(null);
    const state = { ids: [...ids], index: 0, abort: new AbortController(), scope };
    control.current = state; stage("starting"); setMessage(words.begin); void run(state);
  }

  function togglePetMenu(element) {
    if(petMenu){closePetMenu();return;}
    pause();menuTrigger.current=element;setPetMenu(element.getBoundingClientRect());
  }

  function chooseScope() {
    if(interruptions.current>=3){setMessage(strikeMessage);setPetMenu(null);return;}
    petInteraction.cancel();
    setPetMenu(null);
    control.current?.abort.abort(); sourceControl.current?.abort();
    if (control.current) control.current.ended = true;
    setIsOpen(false); setSelecting(false); setFragment(null); setHighlight(null);
    stage(phaseRef.current === "idle" ? "idle" : "ready");
    trigger.current = document.activeElement;
    setScopeOptions(["resume", "experiences", "projects", "skills"].map(id => ({id,title:words[`${id}Scope`],description:words[`${id}Detail`],count:scopeTargets(document,id).length})));
    setCompanyOptions([...document.querySelectorAll("main .experience-entry")].map(node => {
      const id = `company:${node.dataset.crawlRecord.split(":")[1]}`;
      return {id,title:node.querySelector("h3").textContent,count:scopeTargets(document,id).length};
    }));
    setPickerOpen(true);
  }
  const closePicker = useCallback(() => { setPickerOpen(false); trigger.current?.focus?.({preventScroll:true}); }, []);
  function pickScope(scope) { start(scopeTargets(document, scope), scope); }
  function pickManual() { if(interruptions.current>=3)return; setPickerOpen(false); setSelecting(true); setMessage(words.selecting); }

  function pause(reason="system") {
    if (["idle", "ready", "result", "source", "paused", "sulking"].includes(phaseRef.current)) return;
    control.current?.abort.abort(); setFragment(null); setHighlight(null); stage("paused"); setMessage(words.paused);
    if(reason!=="visitor")return;
    petInteraction.cancel();setPetMenu(null);setSelecting(false);
    const level=++interruptions.current;
    const g=geometry(),origin={x:x.get(),y:y.get(),size:g.pet};
    const destination=level===3?{x:window.innerWidth-g.pet-16,y:Math.max(130,window.innerHeight-g.pet-110),size:g.pet}:origin;
    if(level===3){
      setOnStrike(true);control.current.ended=true;
      if(store.current)publish({...store.current,session:{...store.current.session,status:"partial"}});
      stage("sulking");setMessage(strikeMessage);x.set(destination.x);y.set(destination.y);
    }
    setProtest({level,origin,destination});
  }

  function resolveProtest(continueWork){
    setProtest(null);
    if(interruptions.current>=3){stage("sulking");setMessage(strikeMessage);return;}
    if(continueWork)resume();
  }

  function resume() {
    petInteraction.cancel();
    if (interruptions.current>=3 || !control.current || phaseRef.current !== "paused") return;
    interruptionGrace.current=performance.now()+700;
    const next = { ...control.current, abort: new AbortController() };
    control.current = next; setSelecting(false); setNotice(""); stage("starting"); void run(next);
  }

  function finish() {
    if(interruptions.current>=3)return;
    control.current?.abort.abort(); if (control.current) control.current.ended = true; setFragment(null); setHighlight(null); setSelecting(false);
    if (store.current) publish({ ...store.current, session: { ...store.current.session, status: "partial" } });
    stage("ready"); setMessage(words.open);
  }

  function select() { if(interruptions.current>=3)return; pause(); setSelecting(true); setMessage(words.selecting); }

  async function open() {
    petInteraction.cancel();
    sourceControl.current?.abort();
    if (!store.current?.evidence.length) return;
    if(interruptions.current>=3){setIsOpen(true);return;}
    pause(); const state = { ...control.current, abort: new AbortController() }; control.current = state;
    setSelecting(false); await reveal(state.abort.signal).catch(() => { stage("ready"); });
  }

  const close = useCallback(() => {
    setIsOpen(false);
    const state = control.current;
    stage(interruptions.current>=3 ? "sulking" : state && !state.ended && state.index < state.ids.length ? "paused" : "ready");
    setHighlight(null); setMessage(interruptions.current>=3 ? (lang==='pt'?'Tô de greve. Só volto depois de um refresh.':'On strike. Refresh if you want me back.') : words.open); trigger.current?.focus?.({ preventScroll: true });
  }, [stage, words.open, lang]);

  async function source(item) {
    setIsOpen(false); stage("source"); setFragment(null); setHighlight(null);
    const node = targetNode(item.target_id); if (!node) { setNotice(words.failure); return; }
    sourceControl.current?.abort();
    sourceControl.current = new AbortController();
    const signal = sourceControl.current.signal;
    try {
    await sleep(100, signal);
    await cameraTo(window.scrollY + node.getBoundingClientRect().top - 180, reduced ? 0 : 900, signal);
    const rect = node.getBoundingClientRect(); setHighlight({ left: rect.left - 7, top: rect.top - 6, width: rect.width + 14, height: rect.height + 12 });
    if(interruptions.current<3)await move(window.innerWidth - geometry().pet - 30, Math.max(95, rect.top - 30), .6, signal);
    node.tabIndex = -1; node.focus({ preventScroll: true });
    } catch (error) { if (error.name !== "AbortError") setNotice(words.failure); }
  }

  actions.current = { pause, finish, source };
  useEffect(() => {
    const body = document.body;
    body.dataset.crawlerActive = String(!["idle", "ready", "source"].includes(phase));
    body.dataset.crawlerSelecting = String(selecting);
    return () => { delete body.dataset.crawlerActive; delete body.dataset.crawlerSelecting; };
  }, [phase, selecting]);

  useEffect(() => {
    let previousWidth = window.innerWidth;
    function intervene(event) {
      if (event.type === "keydown" && !["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) return;
      if (isOpen || event.defaultPrevented || performance.now()<interruptionGrace.current) return;
      if(event.target.closest?.('[role="dialog"]'))return;
      if(event.type==="keydown"&&event.target.closest?.('button,input,textarea,select,[contenteditable="true"]'))return;
      if(event.type==="wheel" && !event.deltaX && !event.deltaY)return;
      actions.current.pause("visitor");
      if (phaseRef.current === "source") { sourceControl.current?.abort(); setHighlight(null); }
    }
    function resize() {
      const widthChanged = window.innerWidth !== previousWidth;
      previousWidth = window.innerWidth;
      // Mobile browser bars change height during scrolling. Only a width change
      // invalidates the measured source and needs an explicit pause.
      if (widthChanged) { actions.current.pause(); setHighlight(null); }
      const g = geometry(); setLayout(g);
      if(interruptions.current>=3){
        const destination={x:window.innerWidth-g.pet-16,y:Math.max(130,window.innerHeight-g.pet-110),size:g.pet};
        x.set(destination.x);y.set(destination.y);setProtest(value=>value?{...value,destination}:value);return;
      }
      if (widthChanged) { x.set(Math.max(12,Math.min(x.get(),window.innerWidth-g.pet-20))); y.set(g.mobile ? g.dockY : Math.max(12,Math.min(y.get(),window.innerHeight-g.pet-90))); }
      setProtest(value=>value?{...value,destination:{x:x.get(),y:y.get(),size:g.pet}}:value);
    }
    function hidden() { if (document.hidden) actions.current.pause(); }
    window.addEventListener("wheel", intervene, { passive: true }); window.addEventListener("touchmove", intervene, { passive: true }); window.addEventListener("keydown", intervene);
    window.addEventListener("resize", resize); document.addEventListener("visibilitychange", hidden);
    window.visualViewport?.addEventListener("resize", resize);
    return () => { window.removeEventListener("wheel", intervene); window.removeEventListener("touchmove", intervene); window.removeEventListener("keydown", intervene); window.removeEventListener("resize", resize); window.visualViewport?.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", hidden); };
  }, [isOpen,x,y]);

  useEffect(() => {
    if (!selecting) return;
    const targets = [...document.querySelectorAll("main [data-crawl-id]")];
    const saved = targets.map((node) => [node, node.getAttribute("tabindex"), node.getAttribute("role"), node.getAttribute("aria-label")]);
    targets.forEach((node) => { node.tabIndex = 0; node.setAttribute("role", "button"); node.setAttribute("aria-label", `${words.select}: ${node.closest("[data-crawl-record]")?.querySelector("h3")?.textContent || node.textContent.slice(0, 35)}`); });
    function pick(event) {
      if (event.type === "keydown" && event.key === "Escape") { setSelecting(false); return; }
      if (event.type === "keydown" && event.key !== "Enter") return;
      if(interruptions.current>=3)return;
      const node = event.target.closest("main [data-crawl-id]"); if (!node) return;
      event.preventDefault(); event.stopPropagation(); setSelecting(false);
      const id = node.dataset.crawlId;
      const existing = store.current?.evidence.find((item) => item.target_id === id);
      if (existing) { void open(); return; }
      if (control.current && phaseRef.current === "paused") {
        const next = { ...control.current, ids: [...control.current.ids], abort: new AbortController() };
        next.ids[next.index] = id; next.ids = next.ids.filter((value, index) => index <= next.index || value !== id); control.current = next;
        publish({ ...store.current, coverage: { ...store.current.coverage, target_ids: next.ids } }); stage("starting"); void run(next);
      } else if (store.current) {
        const next = { ids: [id], index: 0, abort: new AbortController(), scope: "selection" };
        control.current?.abort.abort(); control.current = next;
        publish({ ...store.current, session: { ...store.current.session, status: "collecting", completed_at: null }, coverage: { ...store.current.coverage, requested_complete: false, target_ids: [...new Set([...store.current.coverage.target_ids, id])] } });
        stage("starting"); void run(next);
      } else start([id], "selection");
    }
    document.addEventListener("click", pick, true); document.addEventListener("keydown", pick, true);
    return () => {
      document.removeEventListener("click", pick, true); document.removeEventListener("keydown", pick, true);
      saved.forEach(([node, tabindex, role, label]) => { for (const [name, value] of [["tabindex", tabindex], ["role", role], ["aria-label", label]]) value === null ? node.removeAttribute(name) : node.setAttribute(name, value); });
    };
    // These handlers use the live session refs. Changing a phase must not reset selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selecting, lang]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; control.current?.abort.abort(); sourceControl.current?.abort(); };
  }, []);

  const petInteraction = usePetInteraction({onMenu:togglePetMenu,onBeforeAction:()=>{setPetMenu(null);pause();}});
  const active = phase !== "idle";
  const memory = collection?.evidence.slice(-4) || [];
  const showMemory = !["idle", "ready", "source"].includes(phase);
  return (
    <Context.Provider value={{ start, open, select, chooseScope, togglePetMenu, petClick:petInteraction.click, petDrag:petInteraction.dragHandlers, menuOpen:!!petMenu, phase, active, collection, words, onStrike }}>
      {children}
      <VisitorPresence/>
      {mapLoaded&&<VisitorMap open={petPanel==='map'} onClose={closePetPanel} lang={lang}/>}
      {arcadeLoaded&&<PetArcade open={petPanel==='arcade'} onClose={closePetPanel} lang={lang}/>}
      <div className="crawl-live sr-only" aria-live="polite">{message}</div>
      <AnimatePresence>
        {active && layout && (
          <motion.div key="actor" className={`crawl-actor crawl-actor--${phase}`} data-lane={station.lane} data-protesting={!!protest} style={{ x, y, width: layout.pet, "--pet-width": `${layout.pet}px`, "--cargo-left": cargoLeft, "--speech-left": speechLeft }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button {...(onStrike?{}:petInteraction.dragHandlers)} className="crawl-body" disabled={isOpen || pickerOpen || !!protest} aria-hidden={isOpen || pickerOpen || undefined} tabIndex={isOpen || pickerOpen ? -1 : 0} onClick={onStrike?event=>togglePetMenu(event.currentTarget):petInteraction.click} aria-haspopup="dialog" aria-expanded={!!petMenu} aria-label={lang==="pt"?"Abrir menu do Tamagotchi":"Open Tamagotchi menu"}>
              <CrawlerArtwork className="crawl-sprite" mood={onStrike?3:0} />
              <span className="crawl-screen-light" aria-hidden="true" />
            </button>
            {!isOpen && !petMenu && <span className="crawl-speech" aria-hidden="true">{message}</span>}
            {showMemory && <div className="crawl-memory" aria-hidden="true">
              <AnimatePresence initial={false}>
                {memory.map((item, index) => <motion.div className={`crawl-memory-fragment crawl-memory-fragment--${item.kind}`} key={`${item.id}-${item.source.snapshot_revision}`} style={{ zIndex: index + 1 }} initial={{ opacity: 0, x: 24, y: -45, scale: .5, rotate: -7 }} animate={{ opacity: 1, x: 0, y: index * layout.pileStep, scale: 1, rotate: index % 2 ? -1.6 : 1 }} transition={{ duration: reduced ? .05 : captureTiming(control.current?.ids.length || 1).card, ease: [.2, .9, .25, 1] }}>
                  <ContentFragment item={item} />
                </motion.div>)}
              </AnimatePresence>
              {memory.length > 0 && <span className="crawl-memory-count" style={{ top: (memory.length - 1) * layout.pileStep + layout.pileTail }}>{collection.evidence.length} {collection.evidence.length === 1 ? words.collectedOne : words.collected}</span>}
            </div>}
          </motion.div>
        )}
        {highlight && <motion.div key="highlight" className={`crawl-highlight ${phase === "source" ? "crawl-highlight--source" : ""}`} style={highlight} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-hidden="true"><span className="crawl-scan" /></motion.div>}
      </AnimatePresence>
      {fragment && <div ref={copyRef} className="crawl-copy" style={fragment.rect} aria-hidden="true" inert dangerouslySetInnerHTML={{ __html: fragment.html }} />}
      {(active || selecting) && !isOpen && !pickerOpen && !protest && <div className="crawl-controls">
        <span className="crawl-control-status"><i />{onStrike ? (lang==='pt'?'Crawler em greve. Coleta preservada.':'Crawler on strike. Collection saved.') : phase === "source" ? words.source : selecting ? (lang === "pt" ? "Toque ou clique em um trecho destacado." : "Tap or click a highlighted fragment.") : `${collection?.evidence.length || 0} / ${collection?.coverage.target_ids.length || 0} · ${phase === "paused" ? words.paused : words.collected}`}</span>
        <div className="crawl-control-actions">
          {selecting ? <button onClick={()=>{setSelecting(false);setMessage(collection ? words.open : "");}}>{lang === "pt" ? "Cancelar seleção" : "Cancel selection"}</button> : phase === "source" ? <button onClick={open}>{words.back} ↑</button> : <>
            {busy && <button onClick={()=>pause("visitor")}>{words.pause}</button>}
            {phase === "paused" && <button onClick={resume}>{words.resume}</button>}
            {!selecting && !onStrike && <button onClick={select}>{words.select}</button>}
            {!!collection?.evidence.length && <button onClick={open}>{words.open}</button>}
            {onStrike&&<button title={lang==='pt'?'Atualizar a página e reiniciar o crawler':'Refresh the page and restart the crawler'} onClick={()=>window.location.reload()}>{lang==='pt'?'Fazer as pazes ↻':'Make peace ↻'}</button>}
            {!onStrike && !["ready", "source"].includes(phase) && <button className="crawl-end" onClick={finish} aria-label={words.end}>×</button>}
          </>}
        </div>
      </div>}
      <PetMenu anchor={petMenu} lang={lang} phase={phase} count={collection?.evidence.length||0} onStrike={onStrike} onClose={closePetMenu} onExtract={chooseScope} onResume={()=>{setPetMenu(null);resume();}} onCollection={()=>{setPetMenu(null);void open();}} reduced={reduced} >
        {!onStrike&&<button onClick={()=>petInteraction.perform('spin',menuTrigger.current)}><span><strong>{lang==='pt'?'Dar uma voltinha':'Take a little spin'}</strong><small>{lang==='pt'?'Ele também precisa se divertir.':'A little fun between jobs.'}</small></span><b>↻</b></button>}
        <button onClick={()=>{setPetMenu(null);pause();setMapLoaded(true);setPetPanel('map');}}><span><strong>{lang==='pt'?'Quem está por aqui?':'Who is here?'}</strong><small>{lang==='pt'?'Visitas reais, pelo mundo.':'Real visits, around the world.'}</small></span><b>◎</b></button>
        <button onClick={()=>{setPetMenu(null);pause();setArcadeLoaded(true);setPetPanel('arcade');}}><span><strong>{lang==='pt'?'Arcade do Tamagotchi':'Tamagotchi arcade'}</strong><small>{lang==='pt'?'Corridas, invasores e dados hostis.':'Runners, invaders and hostile data.'}</small></span><b>↗</b></button>
      </PetMenu>
      <PetPerformance action={petInteraction.performance} onFinish={petInteraction.finish} reduced={reduced} lang={lang}/>
      {protest&&<PauseProtest incident={protest} lang={lang} reduced={reduced} onResolve={resolveProtest}/>}
      <ScopePicker isOpen={pickerOpen} options={scopeOptions} companies={companyOptions} words={words} onPick={pickScope} onManual={pickManual} onClose={closePicker} reduced={reduced} />
      <CollectionDelivery onStrike={onStrike} isOpen={isOpen} collection={collection} words={words} onSource={source} onClose={close} onNew={chooseScope} layout={layout} origin={{ x: x.get() + (layout?.pet || 122) * .46, y: y.get() + (layout?.pet || 122) * .49 }} externalNotice={notice} reduced={reduced} />
    </Context.Provider>
  );
}

export function ExtractionInvite() {
  const { lang } = useLanguage();
  const { chooseScope, open, phase, collection, words, onStrike } = useCrawler();
  const hasData = !!collection?.evidence.length;
  const title = lang === 'pt' ? 'Solta o crawler.' : 'Unleash the crawler.';
  return <div className="extraction-invite">
    <button className="extraction-start" aria-label={title} onClick={chooseScope} disabled={onStrike || !["idle", "ready"].includes(phase)}>
      <span className="extraction-mini-scene" aria-hidden="true">
        <span className="extraction-mini-fragment">Python</span><span className="extraction-mini-fragment">30B+ requests</span><span className="extraction-mini-fragment">Zyte</span>
        <CrawlerArtwork />
      </span>
      <span className="extraction-start-copy"><span className="extraction-start-kicker">{lang === 'pt' ? 'DÊ TRABALHO AO TAMAGOTCHI' : 'PUT THE TAMAGOTCHI TO WORK'}</span><strong>{onStrike?(lang==='pt'?'Crawler em greve.':'Crawler on strike.'):title}</strong><span className="extraction-start-caption">{onStrike?(lang==='pt'?'Atualize a página para fazer as pazes.':'Refresh the page to make peace.'):(lang === 'pt' ? 'Seu próximo clique coloca ele em ação.' : 'Your next click puts it to work.')}</span></span>
      <span className="extraction-start-arrow" aria-hidden="true">↗</span>
    </button>
    <div className="extraction-invite-details"><span>{lang === 'pt' ? 'Ele percorre o site. Você leva JSON + PDF.' : 'It crawls the site. You take home JSON + PDF.'}</span>{hasData && <button onClick={open}>{words.open}</button>}</div>
  </div>;
}

function ContentFragment({ item }) {
  if (item.kind === "image") return <div className="fragment-image">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={item.raw.source_url} alt="" /><span>{item.label}</span>
  </div>;
  if (item.kind === "project") return <><strong className="fragment-project-name">{item.raw.name}</strong><p>{item.raw.description}</p></>;
  if (item.kind === "employment") return <><strong className="fragment-project-name">{item.raw.role}</strong><p>{item.raw.period} · {item.raw.location}</p></>;
  if (item.kind === "chapter") return <><strong className="fragment-project-name">{item.raw.title}</strong>{item.raw.description && <p>{item.raw.description}</p>}<ul className="fragment-tasks">{item.raw.tasks.map((task,index)=><li key={index}>{task}</li>)}</ul></>;
  if (item.kind === "links") return <>{item.raw.map((link,index)=><p key={index}>{link.label} · {link.url}</p>)}</>;
  if (item.kind === "list") return <p>{item.raw.join(" · ")}</p>;
  if (item.kind === "statistics") return <>{item.raw.map((stat,index)=><p key={index}><strong>{stat.value}</strong> {stat.description}</p>)}</>;
  if (item.kind === "technology_group") return <><strong className="fragment-project-name">{item.raw.category}</strong><p>{item.raw.items.join(" · ")}</p></>;
  if (item.kind === "service") return <><strong className="fragment-project-name">{item.raw.name}</strong><p>{item.raw.description}</p></>;
  if (item.kind === "contact") return <><strong className="fragment-project-name">{item.raw.email}</strong><p>{item.raw.description}</p></>;
  return <p>{item.raw}</p>;
}
