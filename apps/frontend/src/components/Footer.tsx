"use client"

import { TrendingUp, Mail, Phone, MapPin, Twitter, Github, Linkedin, ArrowUp } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative border-t border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/40"></div>
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            
            <div className="space-y-6">
              <div className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-xl blur-md group-hover:bg-emerald-500/30 transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-br from-emerald-400 to-emerald-600 p-2.5 rounded-xl shadow-lg shadow-emerald-500/25">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                    TradePro
                  </span>
                  <span className="text-xs text-emerald-400 font-medium tracking-wide">
                    ADVANCED TRADING
                  </span>
                </div>
              </div>
              
              <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
                Empowering traders with cutting-edge tools and real-time market insights for superior trading performance.
              </p>
              
              <div className="flex space-x-4">
                {[
                  { icon: Twitter, href: "#", label: "Twitter" },
                  { icon: Github, href: "#", label: "GitHub" },
                  { icon: Linkedin, href: "#", label: "LinkedIn" },
                ].map(({ icon: Icon, href, label }) => (
                  <Link 
                    key={label}
                    href={href} 
                    className="group relative w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-emerald-500/50 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/10 rounded-xl transition-colors duration-300"></div>
                    <Icon className="h-4 w-4 text-zinc-400 group-hover:text-emerald-400 transition-colors duration-300" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Platform</h3>
              <nav className="space-y-3">
                {[
                  { name: "Dashboard", href: "/dashboard" },
                  { name: "Markets", href: "/markets" },
                  { name: "Portfolio", href: "/portfolio" },
                  { name: "Analytics", href: "/analytics" },
                  { name: "Trading Tools", href: "/tools" },
                ].map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="block text-sm text-zinc-400 hover:text-emerald-400 transition-colors duration-300 group"
                  >
                    <span className="relative">
                      {link.name}
                      <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-emerald-400 group-hover:w-full transition-all duration-300"></span>
                    </span>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Resources</h3>
              <nav className="space-y-3">
                {[
                  { name: "Documentation", href: "/docs" },
                  { name: "API Reference", href: "/api" },
                  { name: "Tutorials", href: "/tutorials" },
                  { name: "Market News", href: "/news" },
                  { name: "Support", href: "/support" },
                ].map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="block text-sm text-zinc-400 hover:text-emerald-400 transition-colors duration-300 group"
                  >
                    <span className="relative">
                      {link.name}
                      <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-emerald-400 group-hover:w-full transition-all duration-300"></span>
                    </span>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Stay Connected</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm text-zinc-400">
                  <Mail className="h-4 w-4 text-emerald-400" />
                  <span>support@tradepro.com</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-zinc-400">
                  <Phone className="h-4 w-4 text-emerald-400" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-zinc-400">
                  <MapPin className="h-4 w-4 text-emerald-400" />
                  <span>New York, NY</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-zinc-400">Get market insights delivered to your inbox.</p>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-3 py-2 text-sm bg-zinc-900/50 border border-zinc-800/50 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25"
                  />
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                  >
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="py-8 border-t border-zinc-800/50">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-6">
              <p className="text-sm text-zinc-400">
                © {new Date().getFullYear()} TradePro. All rights reserved.
              </p>
              <div className="flex items-center space-x-6">
                <Link href="/privacy" className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors duration-300">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors duration-300">
                  Terms of Service
                </Link>
              </div>
            </div>
            
            <Button
              onClick={scrollToTop}
              variant="outline"
              size="sm"
              className="bg-zinc-900/50 hover:bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all duration-300 group"
            >
              <ArrowUp className="h-4 w-4 mr-2 group-hover:-translate-y-1 transition-transform duration-300" />
              Back to Top
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent"></div>
    </footer>
  );
};

export default Footer;