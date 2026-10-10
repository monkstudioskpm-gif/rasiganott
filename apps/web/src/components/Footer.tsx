import { Link } from 'react-router-dom';
import { Twitter, Facebook, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#07080e] pt-12 pb-16 text-gray-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <Link to="/" className="inline-block">
              <span className="font-extrabold text-2xl tracking-tighter text-white font-sans">
                RASIGAN<span className="text-sky-400 font-extrabold text-2xl">.</span>
              </span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
              Rasigan OTT offers the latest movies, web series, short films, and Shots highlight clips. Empowering independent creators directly.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="#twitter" className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-sky-500 hover:text-white flex items-center justify-center transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#facebook" className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-sky-500 hover:text-white flex items-center justify-center transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#instagram" className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-sky-500 hover:text-white flex items-center justify-center transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Home Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wider">Home</h4>
            <ul className="space-y-2">
              <li><Link to="/browse/movies" className="hover:text-white transition-colors">Movies</Link></li>
              <li><Link to="/browse/web-series" className="hover:text-white transition-colors">TV Shows & Series</Link></li>
              <li><Link to="/browse/short-films" className="hover:text-white transition-colors">Short Films</Link></li>
              <li><Link to="/shots" className="hover:text-white transition-colors">Shots</Link></li>
              <li><Link to="/library" className="hover:text-white transition-colors">My Watchlist</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wider">Support</h4>
            <ul className="space-y-2">
              <li><a href="#contact" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#terms" className="hover:text-white transition-colors">Terms & Conditions</a></li>
              <li><a href="#privacy" className="hover:text-white transition-colors">Privacy & Policy</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Creator Funding FAQ</a></li>
            </ul>
          </div>

          {/* Subscription & Features */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wider">Subscription</h4>
            <ul className="space-y-2">
              <li><a href="#plans" className="hover:text-white transition-colors">Subscription Plans</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Features & 4K Streaming</a></li>
              <li><a href="#devices" className="hover:text-white transition-colors">Supported Devices</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
          <p>© {new Date().getFullYear()} Rasigan OTT v2. All rights reserved.</p>
          <p>Built with ❤️ for indie cinema and Tamil content creators.</p>
        </div>
      </div>
    </footer>
  );
}
