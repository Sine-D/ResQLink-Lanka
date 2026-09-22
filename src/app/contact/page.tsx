import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-16 space-y-8 flex-1">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-white">Contact & Support</h1>
          <p className="text-slate-400 text-sm">Disaster Management Center Emergency Helpline & Feedback</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center space-y-2">
            <Phone className="w-6 h-6 text-red-500 mx-auto" />
            <h4 className="font-bold text-white text-sm">Emergency Hotline</h4>
            <p className="text-xs text-slate-400">Dial 117 (DMC 24/7 Control Room)</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center space-y-2">
            <Mail className="w-6 h-6 text-red-500 mx-auto" />
            <h4 className="font-bold text-white text-sm">Email Inquiries</h4>
            <p className="text-xs text-slate-400">info@dmc.gov.lk</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center space-y-2">
            <MapPin className="w-6 h-6 text-red-500 mx-auto" />
            <h4 className="font-bold text-white text-sm">Headquarters</h4>
            <p className="text-xs text-slate-400">Vidya Mawatha, Colombo 07, Sri Lanka</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
