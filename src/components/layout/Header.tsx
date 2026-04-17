export default function Header() {
  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <path d="M6 22 L16 8 L26 22 Z" fill="none" stroke="white" strokeWidth="3" strokeLinejoin="round" />
            <line x1="10" y1="22" x2="22" y2="22" stroke="white" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="font-heading text-xl font-bold">RoofPost AI</h1>
      </div>
    </header>
  )
}
