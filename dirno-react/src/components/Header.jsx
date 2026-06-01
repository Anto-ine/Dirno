export default function Header() {
  return (
    <header>
      <div className="header-inner">
        <div className="wordmark">
          <div className="wordmark-dot">
            <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="7" cy="7" r="2" fill="white"/>
            </svg>
          </div>
          <div>
            <div className="wordmark-text">DIRNO</div>
            <div className="wordmark-sub">Transports Exceptionnels</div>
          </div>
        </div>
        <div className="header-right">
          <span className="pill pill--orange"><span className="pill-dot"></span>Beta</span>
        </div>
      </div>
    </header>
  );
}
