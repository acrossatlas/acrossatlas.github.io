import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

/* Top-left site bar on every inner page: back to the home page, then the small across mark. */
export default function SiteBar() {
  return (
    <header className="title-row site-bar">
      <Link className="btn btn--ghost btn--lg btn--icon site-back" to="/" aria-label="返回首页" title="返回首页"><ArrowLeft aria-hidden="true" /></Link>
      <Link to="/" aria-label="across home"><span>across</span></Link>
    </header>
  );
}
