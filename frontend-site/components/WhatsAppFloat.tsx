import { whatsappLink } from "@/data/site";
import WhatsAppIcon from "./WhatsAppIcon";

/**
 * Floating WhatsApp button, visible on every page (bottom-right).
 */
export default function WhatsAppFloat() {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] p-3.5 text-white shadow-lg shadow-black/40 transition hover:scale-105"
    >
      <WhatsAppIcon className="h-7 w-7" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-300 group-hover:max-w-xs group-hover:pr-1 group-hover:opacity-100">
        Chat with us
      </span>
    </a>
  );
}
