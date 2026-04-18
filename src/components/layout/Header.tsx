export default function Header() {
  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-surface">
      <div className="flex items-center gap-3">
        <img
          src="https://assets.cdn.filesafe.space/Gxry1a2QLdf9fdbKkdhz/media/69e3916a8696a78b8dddae2c.jpeg"
          alt="Social Planner Automation"
          className="h-16 w-auto rounded-lg object-contain"
        />
        <h1 className="font-heading text-xl font-bold text-text-primary">Social Planner Automation</h1>
      </div>
    </header>
  )
}
