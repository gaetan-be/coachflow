import { useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  color?: 'teal' | 'slate' | 'green';
}

const colorMap = {
  teal: 'bg-[rgba(64,162,192,0.08)] text-[#40A2C0] border-[rgba(64,162,192,0.2)]',
  slate: 'bg-[rgba(107,157,181,0.08)] text-[#6B9DB5] border-[rgba(107,157,181,0.3)]',
  green: 'bg-[rgba(76,175,130,0.08)] text-[#4caf82] border-[rgba(76,175,130,0.3)]',
};

export function TagInput({ tags, onChange, placeholder, color = 'teal' }: TagInputProps) {
  const [input, setInput] = useState('');

  function addTag() {
    const val = input.trim();
    if (!val || tags.includes(val)) {
      setInput('');
      return;
    }
    onChange([...tags, val]);
    setInput('');
  }

  function removeTag(i: number) {
    onChange(tags.filter((_, idx) => idx !== i));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 min-h-9">
        {tags.map((t, i) => (
          <span
            key={i}
            onClick={() => removeTag(i)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-[20px]',
              'text-[12px] font-medium cursor-pointer transition-all border',
              colorMap[color],
            )}
          >
            {t}
            <span className="text-sm leading-none opacity-50 hover:opacity-100 transition-opacity">&times;</span>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={placeholder}
        className="w-full max-w-xs bg-white border border-[#EAEDEF] rounded-xl px-3.5 py-2.5
                   text-[13px] text-[#202C34] outline-none transition-all placeholder:text-[#BFC5CC]
                   focus:border-[#40A2C0] focus:shadow-[0_0_0_3px_rgba(64,162,192,0.08)]"
      />
    </div>
  );
}
