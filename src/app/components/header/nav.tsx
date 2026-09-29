'use client';

import classNames from 'classnames';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from '@/app/components';
import { redaction20, recursive } from '@/app/fonts';
import styles from './header.module.scss';

const MOBILE_QUERY = '(max-width: 900px)';
const navigationLinks = [
  { href: 'https://linkedin.com/in/maxdavid', key: 'linkedin', label: 'linkedin', target: 'linkedin' },
  { href: '/MaxDavid_resume.pdf', key: 'resume', label: 'resume' },
] as const;
const useBrowserLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

const OutboundArrow = () => (
  <svg aria-hidden='true' focusable='false' className={styles.arrow} width='24' height='24' viewBox='0 0 24 24' fill='none'>
    <path d='M5 19L19 5M11 5H19V13' />
  </svg>
);

export const Nav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const desktopRef = useRef<HTMLElement>(null);
  const lastFocusRef = useRef<{ context: 'desktop' | 'mobile' | 'opener'; key?: string } | null>(null);

  const closeMenu = (restoreFocus = false) => {
    if (restoreFocus) buttonRef.current?.focus({ preventScroll: true });
    setIsOpen(false);
  };

  useBrowserLayoutEffect(() => {
    if (panelRef.current) panelRef.current.inert = !isOpen;
  }, [isOpen]);

  useBrowserLayoutEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const previous = !active || active === document.body ? lastFocusRef.current : null;
      if (!event.matches) {
        const wasMobile = Boolean(active && panelRef.current?.contains(active)) ||
          active === buttonRef.current || previous?.context === 'mobile' || previous?.context === 'opener';
        const key = active?.closest<HTMLElement>('[data-navigation-key]')?.dataset.navigationKey ?? previous?.key;
        setIsOpen(false);
        if (wasMobile) {
          const destination = key
            ? desktopRef.current?.querySelector<HTMLElement>(`[data-navigation-key='${key}']`)
            : null;
          (destination ?? desktopRef.current?.querySelector<HTMLElement>('a'))?.focus({ preventScroll: true });
        }
      } else if ((active && desktopRef.current?.contains(active)) || previous?.context === 'desktop') {
        buttonRef.current?.focus({ preventScroll: true });
      }
    };
    mediaQuery.addEventListener('change', handleBreakpointChange);
    return () => mediaQuery.removeEventListener('change', handleBreakpointChange);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (panelRef.current?.contains(document.activeElement)) {
        buttonRef.current?.focus({ preventScroll: true });
      }
      setIsOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  return (
    <>
      <nav aria-label='Primary navigation' className={styles.desktopNav} ref={desktopRef}>
        <ul>
          {navigationLinks.map((link) => (
            <li className={styles.link} key={link.key}>
              <Link
                href={link.href}
                data-navigation-key={link.key}
                target={'target' in link ? link.target : undefined}
                onFocus={() => { lastFocusRef.current = { context: 'desktop', key: link.key }; }}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <button
        className={styles.mobileMenuButton}
        type='button'
        aria-label={isOpen ? 'Close links' : 'Open links'}
        aria-expanded={isOpen}
        aria-controls='mobile-primary-navigation'
        ref={buttonRef}
        onFocus={() => { lastFocusRef.current = { context: 'opener' }; }}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault();
        }}
      >
        <span>links</span>
        <svg aria-hidden='true' focusable='false' width='16' height='16' viewBox='0 0 16 16' fill='none'>
          <path d='M2 8H14' />
          <path className={styles.plusStem} d='M8 2V14' />
        </svg>
      </button>
      <div className={styles.mobileDisclosure} data-open={isOpen} aria-hidden={!isOpen} ref={panelRef}>
        <div className={styles.mobileClip}>
          <div className={styles.mobileCard}>
            <nav aria-label='Primary navigation' id='mobile-primary-navigation'>
              <ul>
                {navigationLinks.map((link) => (
                  <li key={link.key}>
                    <a
                      className={classNames(styles.mobileLink, redaction20.className)}
                      href={link.href}
                      data-navigation-key={link.key}
                      target={'target' in link ? link.target : undefined}
                      tabIndex={isOpen ? undefined : -1}
                      onClick={() => closeMenu(true)}
                      onFocus={() => { lastFocusRef.current = { context: 'mobile', key: link.key }; }}
                    >
                      <span>{link.label}</span>
                      <OutboundArrow />
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    className={classNames(styles.mobileLink, styles.mobileEmail, recursive.className)}
                    href='mailto:me@maxdavid.com'
                    tabIndex={isOpen ? undefined : -1}
                    onClick={() => closeMenu(true)}
                    onFocus={() => { lastFocusRef.current = { context: 'mobile' }; }}
                  >
                    <span>me@maxdavid.com</span>
                    <OutboundArrow />
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};
