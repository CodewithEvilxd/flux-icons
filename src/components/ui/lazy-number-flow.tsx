"use client";

export default function LazyNumberFlow({ value, suffix = "" }: { value: number; suffix?: string }) {
  return <>{value}{suffix}</>;
}
