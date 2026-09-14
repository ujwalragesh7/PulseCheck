"use client";

import { useEffect, useRef, useState } from "react";

type Option = {
  value: string;
  label: string;
  description?: string;
};

type PremiumSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
};

export default function PremiumSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  icon,
  className = "",
}: PremiumSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function selectOption(option: Option) {
    onChange(option.value);
    setOpen(false);
  }

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full ${className}`}
    >
      {/* SELECT BUTTON */}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`
          group
          relative
          flex
          min-h-[54px]
          w-full
          items-center
          gap-3
          rounded-xl
          border
          px-4
          text-left
          outline-none
          transition-all
          duration-200

          ${
            open
              ? `
                border-[#4C8DFF]
                bg-[var(--pc-select-active)]
                shadow-[0_0_0_3px_rgba(76,141,255,0.12)]
              `
              : `
                border-[var(--pc-border)]
                bg-[var(--pc-input)]
                hover:border-[var(--pc-border-hover)]
              `
          }
        `}
      >
        {/* ICON */}

        {icon && (
          <span
            className={`
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-lg
              bg-[var(--pc-icon-bg)]
              text-[var(--pc-muted)]
              transition-colors
              ${
                open
                  ? "text-[#4C8DFF]"
                  : "group-hover:text-[var(--pc-text)]"
              }
            `}
          >
            {icon}
          </span>
        )}

        {/* VALUE */}

        <span className="min-w-0 flex-1">
          <span
            className={`
              block
              truncate
              text-sm
              font-medium
              ${
                selected
                  ? "text-[var(--pc-text)]"
                  : "text-[var(--pc-muted)]"
              }
            `}
          >
            {selected?.label ?? placeholder}
          </span>

          {selected?.description && (
            <span className="mt-0.5 block truncate text-[11px] text-[var(--pc-muted)]">
              {selected.description}
            </span>
          )}
        </span>

        {/* CHEVRON */}

        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`
            shrink-0
            text-[var(--pc-muted)]
            transition-transform
            duration-200
            ${open ? "rotate-180 text-[#4C8DFF]" : ""}
          `}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* DROPDOWN */}

      {open && (
        <div
          className="
            absolute
            left-0
            right-0
            z-[100]
            mt-2
            overflow-hidden
            rounded-xl
            border
            border-[var(--pc-border)]
            bg-[var(--pc-dropdown)]
            p-1.5
            shadow-[0_20px_50px_rgba(0,0,0,0.22)]
            backdrop-blur-xl
            animate-in
          "
          role="listbox"
        >
          {options.map((option) => {
            const active = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => selectOption(option)}
                className={`
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-lg
                  px-3
                  py-3
                  text-left
                  transition-all
                  duration-150

                  ${
                    active
                      ? `
                        bg-[#4C8DFF]/12
                        text-[#4C8DFF]
                      `
                      : `
                        text-[var(--pc-text)]
                        hover:bg-[var(--pc-hover)]
                      `
                  }
                `}
              >
                {/* OPTION ICON */}

                <span
                  className={`
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    ${
                      active
                        ? "bg-[#4C8DFF]/10 text-[#4C8DFF]"
                        : "bg-[var(--pc-icon-bg)] text-[var(--pc-muted)]"
                    }
                  `}
                >
                  {icon ?? (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  )}
                </span>

                {/* OPTION TEXT */}

                <span className="min-w-0 flex-1">
                  <span
                    className={`
                      block
                      truncate
                      text-sm
                      ${
                        active
                          ? "font-semibold"
                          : "font-medium"
                      }
                    `}
                  >
                    {option.label}
                  </span>

                  {option.description && (
                    <span className="mt-0.5 block truncate text-[11px] text-[var(--pc-muted)]">
                      {option.description}
                    </span>
                  )}
                </span>

                {/* CHECK */}

                {active && (
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-[#4C8DFF]"
                  >
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}