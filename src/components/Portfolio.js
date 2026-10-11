import Services from "@/components/Services";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import Skills from "@/components/Skills";
import AgentSkills from "@/components/AgentSkills";
import { getSkills } from "@/lib/skills.mjs";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default async function Home() {
  const agentSkills = await getSkills();
  return (
    <main>
      <Navbar />
      <Hero />
      <Experience />
      <Projects />
      <AgentSkills data={agentSkills} />
      <Skills />
      <Services />
      <Contact />
      <Footer />
    </main>
  );
}
