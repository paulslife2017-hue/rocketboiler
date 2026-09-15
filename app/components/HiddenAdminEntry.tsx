"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "./HiddenAdminEntry.module.css";

const CLICK_WINDOW_MS = 750;
const REQUIRED_CLICKS = 2;

export default function HiddenAdminEntry() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const clicks = useRef<number[]>([]);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  function handleBrandClick(event: MouseEvent<HTMLAnchorElement>) {
    const now = Date.now();
    clicks.current = [...clicks.current.filter((time) => now - time <= CLICK_WINDOW_MS), now];

    if (clicks.current.length < REQUIRED_CLICKS) return;

    event.preventDefault();
    clicks.current = [];
    setCode("");
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setCode("");
  }

  function enterAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      sessionStorage.setItem("rocket-admin-entry", code);
    } catch {
      // The admin page will show its regular sign-in form if storage is unavailable.
    }
    router.push("/admin");
  }

  return (
    <>
      <a className={`brand ${styles.trigger}`} href="#top" aria-label="로켓보일러 홈" onClick={handleBrandClick}>
        <span className="brand-symbol">R</span>
        <span><b>로켓</b>보일러<small>가정용 보일러 교체·설치</small></span>
      </a>

      {open && (
        <div className={styles.backdrop} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
          <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="admin-entry-title">
            <button className={styles.close} type="button" aria-label="닫기" onClick={close}>×</button>
            <span className={styles.mark}>R↗</span>
            <h2 id="admin-entry-title">관리자 접근</h2>
            <form onSubmit={enterAdmin}>
              <label htmlFor="hidden-admin-code">접근 코드</label>
              <input
                ref={input}
                id="hidden-admin-code"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={20}
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
              <button type="submit" disabled={!code}>확인</button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
