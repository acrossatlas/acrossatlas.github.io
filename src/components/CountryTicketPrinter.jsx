import { useEffect, useId, useRef, useState } from 'react';
import { Printer, RotateCw, X } from 'lucide-react';
import CountryTicket from './CountryTicket';
import { countryOnlyVisits, countryVisits, journeys } from '../data/archive';

export default function CountryTicketPrinter({ countries, onClose }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const [printVersion, setPrintVersion] = useState(0);
  const [printing, setPrinting] = useState(true);
  const tickets = countries.map(country => ({ country, visit: countryVisits(country.code, journeys, countryOnlyVisits)[0] })).filter(ticket => ticket.visit);
  // The roll feeds out at a steady pace, so a longer strip takes proportionally longer.
  const feedMs = 900 + tickets.length * 650;

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    // Also finish the announcement when reduced motion skips the paper animation.
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : feedMs + 100;
    const timer = window.setTimeout(() => setPrinting(false), duration);
    return () => window.clearTimeout(timer);
  }, [printVersion, feedMs]);

  const print = () => {
    setPrintVersion(version => version + 1);
    setPrinting(true);
  };

  return <dialog
    ref={dialogRef}
    className="ticket-printer-dialog"
    aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}
  >
    <div className="ticket-printer-dialog__content">
      <header className="ticket-printer-dialog__header">
        <span className="ticket-printer-dialog__icon" aria-hidden="true"><Printer size={17} strokeWidth={1.9} /></span>
        <div>
          <h2 id={titleId}>Travel tickets</h2>
          <p>{tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'} on one roll</p>
        </div>
        <button className="ticket-printer-dialog__close" type="button" aria-label="Close travel tickets" onClick={onClose}><X size={17} aria-hidden="true" /></button>
      </header>
      <div className="ticket-printer" data-printing={printing}>
        <div className="ticket-printer__housing" aria-hidden="true">
          <span className="ticket-printer__light" />
          <div className="ticket-printer__slot" />
        </div>
        <div className="ticket-printer__output">
          <ol className="ticket-printer__roll" key={printVersion} style={{ animationDuration: `${feedMs}ms` }} onAnimationEnd={() => setPrinting(false)}>
            {tickets.map(({ country, visit }) => <li key={country.code} aria-label={`${country.name} ticket`}>
              <CountryTicket country={country} visit={visit} />
            </li>)}
          </ol>
        </div>
      </div>
      <footer className="ticket-printer__footer">
        <span>{printing ? 'Printing…' : `${tickets.length} ${tickets.length === 1 ? 'ticket' : 'tickets'} printed`}</span>
        <button className="ticket-printer__reprint" type="button" onClick={print} disabled={printing}><RotateCw size={14} aria-hidden="true" />Print again</button>
      </footer>
      <p className="sr-only" role="status">{printing ? `Printing ${tickets.length} travel tickets` : `${tickets.length} travel tickets printed`}</p>
    </div>
  </dialog>;
}
