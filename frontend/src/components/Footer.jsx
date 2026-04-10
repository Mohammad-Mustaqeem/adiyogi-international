import { NAV_LINKS } from "@/constants";

export default function Footer() {
  return (
    <footer className="bg-navy-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
          {/* Brand */}
          <div>
            <img
              src="/logo.png"
              alt="Adiyogi International"
              className="h-12 sm:h-14 w-auto mb-4"
            />
            <p className="text-navy-200 text-sm leading-relaxed max-w-xs">
              Come Experience the Quality. Premium products with a commitment to
              excellence and customer satisfaction.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-semibold text-champagne-400 mb-4 sm:mb-5 text-base sm:text-lg">
              Quick Links
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {NAV_LINKS.map(([to, label]) => (
                <li key={to}>
                  <a
                    href={to}
                    className="text-navy-200 hover:text-champagne-400 text-sm transition-colors flex items-center gap-2"
                  >
                    <span className="text-champagne-500">›</span> {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display font-semibold text-champagne-400 mb-4 sm:mb-5 text-base sm:text-lg">
              Contact
            </h3>
            <div className="space-y-2 sm:space-y-3 text-sm text-navy-200">
              <p className="font-semibold text-white">Adiyogi International</p>
              <p className="flex items-start gap-2">
                <span>📍</span> Bhoomi Agrotech, Vijaypur
              </p>
              <div className="space-y-1 mt-2">
                <p className="flex items-center gap-2">
                  <span>📞</span> <a href="tel:7975198804" className="hover:text-champagne-400 transition-colors">7975198804</a>
                </p>
                <p className="flex items-center gap-2">
                  <span>📞</span> <a href="tel:8123458984" className="hover:text-champagne-400 transition-colors">8123458984</a>
                </p>
                <p className="flex items-center gap-2">
                  <span>📞</span> <a href="tel:8722812222" className="hover:text-champagne-400 transition-colors">8722812222</a>
                </p>
                <p className="flex items-center gap-2">
                <span>📦</span> Premium quality industrial products
              </p>
              <p className="text-navy-300 text-xs leading-relaxed mt-3">
                WhatsApp orders processed within 24 hours. We&apos;ll confirm your
                order shortly after placement.
              </p>
              </div>
            </div>
          </div>
        </div>

        <div className="gold-divider my-8 sm:my-10" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs sm:text-sm">
          <p className="text-navy-400">
            © {new Date().getFullYear()} Adiyogi International. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
