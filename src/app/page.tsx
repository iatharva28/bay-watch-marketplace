"use client";

import { useEffect, useState } from "react";
import SmoothScroll from "@/components/bay/SmoothScroll";
import ScrollProgress from "@/components/bay/ScrollProgress";
import Loader from "@/components/bay/Loader";
import Navbar from "@/components/bay/Navbar";
import Hero from "@/components/bay/Hero";
import Manifesto from "@/components/bay/Manifesto";
import Collections from "@/components/bay/Collections";
import Movements from "@/components/bay/Movements";
import LimitedEditions from "@/components/bay/LimitedEditions";
import Journal from "@/components/bay/Journal";
import Footer from "@/components/bay/Footer";

const SECTIONS = [
  { id: "top", label: "Hero" },
  { id: "collections", label: "Collections" },
  { id: "movements", label: "Movements" },
  { id: "limited", label: "Limited" },
  { id: "journal", label: "Journal" },
  { id: "contact", label: "Maison" },
];

export default function Home() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [ready]);

  return (
    <SmoothScroll>
      <Loader onDone={() => setReady(true)} />
      <ScrollProgress sections={SECTIONS} />
      <Navbar />

      <main className="relative">
        <Hero />
        <Manifesto />
        <Collections />
        <Movements />
        <LimitedEditions />
        <Journal />
        <Footer />
      </main>
    </SmoothScroll>
  );
}
