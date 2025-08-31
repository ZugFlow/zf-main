import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram, Twitter, Linkedin, Phone } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-br from-purple-900 to-indigo-900 text-white pt-16 pb-6 overflow-hidden">
      {/* Pattern di sfondo */}
      <div className="absolute inset-0 opacity-5" 
        style={{
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Sezione principale del footer */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-16">
          {/* Colonna del logo e informazioni */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <Image src="/logo.png" alt="Logo" width={180} height={48} className="h-12 w-auto" />
            </Link>
            <p className="text-gray-300 mb-6 max-w-md">
              Design, Code and Ship! Il miglior gestionale per appuntamenti dedicato a parrucchieri, barbieri ed estetisti.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Colonne di link */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white border-b border-purple-500 pb-2">About</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Company</a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Careers</a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Blog</a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-white border-b border-purple-500 pb-2">Support</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Contact Support</a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Help Resources</a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Release Updates</a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-white border-b border-purple-500 pb-2">Platform</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Terms &amp; Privacy</a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">FAQ</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Sezione di contatto */}
        <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Hai domande?</h3>
              <p className="text-gray-300">Contattaci per maggiori informazioni o per richiedere un preventivo</p>
            </div>
            <div className="flex space-x-2 mt-4 md:mt-0">
              <a href="#" className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium rounded-lg transition-colors">
                Contattaci
              </a>
              <a href="tel:+123-456-7890" className="flex items-center px-5 py-2 border border-white/30 hover:bg-white/10 text-white rounded-lg transition-colors">
                <Phone className="h-4 w-4 mr-2" />
                +123-456-7890
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-white/10 text-center">
          <p className="text-sm text-gray-400">
            © 2024 All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
};
