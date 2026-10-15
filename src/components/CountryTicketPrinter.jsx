import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Printer, RotateCw, X } from 'lucide-react';
import CountryTicket from './CountryTicket';
import { countryOnlyVisits, countryVisits, journeys } from '../data/archive';

export default function CountryTicketPrinter({ countries, onClose }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const [selectedCode, setSelectedCode] = useState(countries[0].code);
  const [printVersion, setPrintVersion] = useState(0);
  const [printing, setPrinting] = useState(true);
  const country = countries.find(item => item.code === selectedCode);
  const visit = countryVisits(selectedCode, journeys, countryOnlyVisits)[0];

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
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1600;
    const timer = window.setTimeout(() => setPrinting(false), duration);
    return () => window.clearTimeout(timer);
  }, [selectedCode, printVersion]);

  const print = code => {
    setSelectedCode(code);
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
        <div><Printer size={18} aria-hidden="true" /><h2 id={titleId}>Travel tickets</h2></div>
        <button className="ticket-printer-dialog__close" type="button" aria-label="Close travel tickets" onClick={onClose}><X size={18} aria-hidden="true" /></button>
      </header>
      <div className="ticket-printer__toolbar">
        <div className="ticket-printer__country">
          <select aria-label="Choose a country ticket" value={selectedCode} onChange={event => print(event.target.value)}>
            {countries.map(item => <option value={item.code} key={item.code}>{item.name}</option>)}
          </select>
          <ChevronDown size={14} aria-hidden="true" />
        </div>
        <button className="ticket-printer__reprint" type="button" onClick={() => print(selectedCode)}><RotateCw size={14} aria-hidden="true" />Print again</button>
      </div>
      <div className="ticket-printer" data-printing={printing}>
        <div className="ticket-printer__housing" aria-hidden="true"><div className="ticket-printer__slot" /></div>
        <div className="ticket-printer__output">
          <div className="ticket-printer__paper" key={`${selectedCode}-${printVersion}`} onAnimationEnd={() => setPrinting(false)}>
            <CountryTicket country={country} visit={visit} />
          </div>
        </div>
      </div>
      <p className="sr-only" role="status">{printing ? `Printing ${country.name} ticket` : `${country.name} ticket ready`}</p>
    </div>
  </dialog>;
}
