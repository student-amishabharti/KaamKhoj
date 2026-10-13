import { ICON_PATHS, type IconName } from "@/components/Icon";

// Pehli screen ki tasveer: koi bolta hai "Kal painter chahiye", phone par paas ke kaarigar dikhte hain,
// aur ek kaarigar "Main aaunga" kehta hai. Ek nazar mein samajh aata hai ki app kis kaam ki hai.
function Badge({ x, y, name }: { x: number; y: number; name: IconName }) {
  return (
    <g>
      <circle cx={x} cy={y} r="22" fill="var(--kk-surface)" stroke="var(--kk-line)" strokeWidth="1.5" />
      <svg x={x - 11} y={y - 11} width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="var(--kk-brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {ICON_PATHS[name]}
      </svg>
    </g>
  );
}

function MapPin({ x, y, s = 1, main = false }: { x: number; y: number; s?: number; main?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0-22C-7-22-12.5-16.6-12.5-9.8-12.5-1 0 10 0 10S12.5-1 12.5-9.8C12.5-16.6 7-22 0-22Z"
        fill={main ? "var(--kk-brand)" : "var(--kk-surface-2)"} stroke={main ? "none" : "var(--kk-fg-2)"} strokeWidth="1.5" />
      {main ? (
        <path d="m-5-10 3.5 3.5L5.5-13" fill="none" stroke="var(--kk-bg)" strokeWidth="2.6"
          strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <circle cx="0" cy="-10" r="3.5" fill="var(--kk-fg-2)" />
      )}
    </g>
  );
}

export default function HeroArt({ className = "w-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 330" className={className} role="img"
      aria-label="Ghar ka malik bolta hai kal painter chahiye, aur paas ka kaarigar kehta hai main aaunga">
      {/* peeche ki halki roshni */}
      <circle cx="200" cy="170" r="150" fill="var(--kk-brand)" opacity="0.07" />
      <circle cx="200" cy="170" r="118" fill="none" stroke="var(--kk-line)" strokeDasharray="3 7" />

      {/* phone */}
      <rect x="138" y="38" width="124" height="240" rx="24" fill="var(--kk-surface)" stroke="var(--kk-line)" strokeWidth="2" />
      <rect x="148" y="56" width="104" height="206" rx="14" fill="var(--kk-bg)" />
      <rect x="183" y="45" width="34" height="5" rx="2.5" fill="var(--kk-line)" />
      {/* naksha */}
      <g stroke="var(--kk-line)" strokeWidth="1.2">
        <path d="M148 110h104M148 170h104M148 225h104M180 56v206M222 56v206" />
      </g>
      <path d="M148 140c25 0 30 40 60 40s30-25 44-25" fill="none" stroke="var(--kk-surface-2)" strokeWidth="8" strokeLinecap="round" />
      <MapPin x={168} y={98} s={0.7} />
      <MapPin x={236} y={140} s={0.7} />
      <MapPin x={176} y={238} s={0.7} />
      <MapPin x={200} y={176} s={1.25} main />
      <ellipse cx="200" cy="189" rx="13" ry="4" fill="var(--kk-brand)" opacity="0.35" />

      {/* bolne wala bubble */}
      <g>
        <rect x="4" y="42" width="184" height="50" rx="16" fill="var(--kk-surface-2)" stroke="var(--kk-line)" strokeWidth="1.5" />
        <path d="M120 92l10 12 4-12" fill="var(--kk-surface-2)" stroke="var(--kk-line)" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M121 91h12" stroke="var(--kk-surface-2)" strokeWidth="3" />
        <circle cx="31" cy="67" r="15" fill="var(--kk-brand)" />
        <svg x="22" y="58" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--kk-bg)"
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {ICON_PATHS.mic}
        </svg>
        <text x="54" y="63" fontSize="11" fill="var(--kk-muted)">Bolo:</text>
        <text x="54" y="80" fontSize="13.5" fontWeight="700" fill="var(--kk-fg)">“Kal painter chahiye”</text>
      </g>

      {/* kaarigar ka jawab */}
      <g>
        <rect x="236" y="232" width="160" height="62" rx="14" fill="var(--kk-surface-2)" stroke="var(--kk-line)" strokeWidth="1.5" />
        <circle cx="260" cy="263" r="14" fill="var(--kk-brand)" opacity="0.2" />
        <text x="260" y="268" fontSize="13" fontWeight="800" textAnchor="middle" fill="var(--kk-brand)">R</text>
        <text x="282" y="256" fontSize="12.5" fontWeight="700" fill="var(--kk-fg)">Ramesh · Painter</text>
        <text x="282" y="273" fontSize="11" fill="var(--kk-muted)">★ 4.0 · 2.6 km</text>
        <rect x="300" y="221" width="90" height="22" rx="11" fill="var(--kk-ok)" />
        <text x="345" y="236" fontSize="11" fontWeight="700" textAnchor="middle" fill="var(--kk-bg)">Main aaunga ✓</text>
      </g>

      {/* kaam ke prakar */}
      <Badge x={52} y={150} name="electrician" />
      <Badge x={70} y={236} name="plumber" />
      <Badge x={128} y={306} name="cleaner" />
      <Badge x={330} y={64} name="painter" />
      <Badge x={360} y={150} name="carpenter" />
      <Badge x={300} y={140} name="mason" />
    </svg>
  );
}
