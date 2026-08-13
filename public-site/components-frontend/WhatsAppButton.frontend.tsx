import { whatsappLink } from "@/data/site";
import Icon from "./Icons.frontend";

type Props = {
  message?: string;
  label?: string;
  className?: string;
};

/**
 * Premium WhatsApp CTA — deep-green with a soft brand glow.
 * Opens WhatsApp with a pre-filled message.
 */
export default function WhatsAppButtonFrontend({
  message,
  label = "Ask Price on WhatsApp",
  className = "",
}: Props) {
  return (
    <a
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn btn-whatsapp ${className}`}
    >
      <Icon name="whatsapp" className="h-[1.15rem] w-[1.15rem]" />
      {label}
    </a>
  );
}
