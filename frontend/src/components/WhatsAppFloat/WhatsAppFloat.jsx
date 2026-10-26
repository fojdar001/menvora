import "./WhatsAppFloat.css";
import { FaWhatsapp } from "react-icons/fa";

export default function WhatsAppFloat() {

  return (

    <a
      href="https://wa.me/919211881387?text=Hi%20Menvora,%20I%20want%20to%20know%20more%20about%20your%20product."
      target="_blank"
      rel="noreferrer"
      className="whatsappFloat"
    >

      <FaWhatsapp />

      <span>Chat With Us</span>

    </a>

  );

}