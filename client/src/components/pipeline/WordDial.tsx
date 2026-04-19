interface WordDialProps {
  label: string;
  sublabel: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function WordDial({
  label,
  sublabel,
  value,
  onChange,
  min = 50,
  max = 350,
  step = 50,
}: WordDialProps) {
  return (
    <div className="mt-5 px-5 py-4 bg-[rgba(107,157,181,0.03)] border border-[rgba(107,157,181,0.15)] rounded-xl flex items-center gap-4">
      <div className="min-w-[110px]">
        <div className="text-[9px] font-semibold tracking-[1.5px] uppercase text-[#202C34] leading-snug">
          {label}
        </div>
        <div className="text-[8px] tracking-[0.5px] text-[#6B7580] font-normal mt-0.5">{sublabel}</div>
      </div>

      <div className="flex-1 flex items-center h-9">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="word-dial-range w-full"
        />
      </div>

      <div className="min-w-[64px] text-center font-[Cormorant_Garamond,serif] text-[22px] font-normal tracking-[1px] text-[#6B9DB5] leading-none">
        {value}
        <span className="block font-[DM_Sans,sans-serif] text-[8px] font-normal tracking-[1px] uppercase text-[#6B7580] mt-0.5">
          mots
        </span>
      </div>
    </div>
  );
}
