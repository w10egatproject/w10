import { ExternalLink, FileSpreadsheet } from 'lucide-react';

export interface SourceSheetCardLink {
  href: string;
  label: string;
  description: string;
  buttonClass: string;
}

export interface SourceSheetCardProps {
  title: string;
  description: string;
  links: readonly SourceSheetCardLink[];
}

export function SourceSheetCard({ title, description, links }: SourceSheetCardProps) {
  return (
    <section
      aria-labelledby="source-sheet-card-title"
      className="flex min-w-0 flex-col gap-4 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-white)] p-4 shadow-sm sm:p-5 lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-muted)] text-[var(--egat-blue)]"
        >
          <FileSpreadsheet size={21} strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <h2 id="source-sheet-card-title" className="text-base font-bold text-[var(--console-navy)]">
            แหล่งข้อมูล
          </h2>
          <p className="mt-0.5 text-sm font-bold text-[var(--text-primary)]">{title}</p>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{description}</p>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            title={link.description}
            className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-center text-sm font-bold shadow-sm transition-colors focus-visible:outline-none ${link.buttonClass}`}
          >
            <ExternalLink size={16} strokeWidth={2.5} aria-hidden="true" />
            <span className="truncate">เปิด Google Sheet {link.description}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
