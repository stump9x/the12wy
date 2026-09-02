"use client";

import { useEffect, useRef, type TextareaHTMLAttributes } from "react";

export function AutoResizeTextarea({ value, onChange, onInput, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const className = ["auto-resize-textarea", props.className].filter(Boolean).join(" ");

  function resize() {
    const element = ref.current;
    if (!element) return;
    element.style.height = "0px";
    element.style.height = `${element.scrollHeight}px`;
  }

  useEffect(() => {
    resize();
  }, [value]);

  return (
    <textarea
      {...props}
      ref={ref}
      className={className}
      value={value}
      style={{ ...props.style, overflowY: "hidden" }}
      onChange={(event) => {
        onChange?.(event);
        requestAnimationFrame(resize);
      }}
      onInput={(event) => {
        onInput?.(event);
        resize();
      }}
    />
  );
}
