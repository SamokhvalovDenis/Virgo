/** Original SVG line work; kept separate from the real studio photographs. */
export function AboutOrnaments() {
  return <div className="about-ornaments" aria-hidden="true">
    <span className="about-contour about-contour-top" />
    <span className="about-contour about-contour-gallery" />
    <span className="about-contour about-contour-bottom" />
    <AboutBranch className="about-branch about-branch-left" />
    <AboutBranch className="about-branch about-branch-right" />
    <AboutBranch className="about-branch about-branch-bottom" />
  </div>
}

function AboutBranch({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 230 430" fill="none">
    <g stroke="currentColor" strokeWidth=".9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 426C35 344 87 294 119 225S144 92 163 14M57 330c42-42 85-63 139-78M99 266C65 220 48 164 46 111M126 204c31-38 59-62 96-75M143 131c-17-29-27-58-26-88" />
      <path d="M97 267C48 249 21 216 16 174c46 16 75 48 81 93ZM97 267c-22-31-45-59-81-93m7 16 64 53m-55-31 57 38M72 314c46-38 84-37 124-62-23 43-69 66-124 62Zm0 0c40-13 79-29 124-62m-100 52 65-39m-45 45 63-48M47 186c-31-36-36-75-29-116 31 30 40 72 29 116Zm0 0L18 70m6 23 18 65m-16-43 15 55M128 199c11-53 44-79 94-70-29 29-55 55-94 70Zm0 0c28-33 57-55 94-70m-79 58 51-49m-38 44 45-44M145 125c-24-21-33-47-28-82 22 22 30 48 28 82Zm0 0-28-82m7 28 16 40M130 182c28-25 54-26 81-14-26 17-53 23-81 14Zm0 0 81-14M34 375c-22-21-34-44-30-72 23 21 33 44 30 72Zm0 0L4 303M31 384c28-24 54-25 78-15-23 19-49 23-78 15Zm0 0 78-15" />
      <path d="M151 71c17-13 27-29 28-48M162 45c-9-7-11-16-8-25 8 7 11 15 8 25Zm1-2c12-1 19-7 21-16-10 0-17 5-21 16ZM163 24c-7-8-7-15-2-23 6 7 7 15 2 23ZM105 254c18-7 31-20 40-38m-13 20c-8-9-8-17-3-24 7 8 8 16 3 24Zm1-1c12 2 20-2 24-10-10-3-17 0-24 10ZM146 216c-6-8-5-15 0-22 5 8 5 15 0 22ZM60 331c-13-7-23-19-27-33m8 17c-10 0-17-5-20-13 10-1 16 4 20 13Zm0 0c5-10 4-17-2-23-6 8-5 15 2 23" />
    </g>
  </svg>
}
