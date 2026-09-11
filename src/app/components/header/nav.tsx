'use client';

import classNames from 'classnames';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from '@/app/components';
import { recursive } from '@/app/fonts';
import styles from './header.module.scss';

const MobileMenuOpen = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(function MobileMenuOpen(props, ref) {
  return (
    <button
      className={classNames(
        styles.mobileMenuButton,
        styles.mobileMenuButtonOpen
      )}
      {...props}
      ref={ref}
    >
      <svg
        aria-hidden='true'
        focusable='false'
        width='32'
        height='32'
        viewBox='0 0 16 12'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          d='M1 2H15'
          stroke='currentColor'
          strokeWidth='1'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M1 6H15'
          stroke='currentColor'
          strokeWidth='1'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M1 10H15'
          stroke='currentColor'
          strokeWidth='1'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    </button>
  );
});

const MobileMenuClose = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(function MobileMenuClose(props, ref) {
  return (
    <button
      className={classNames(
        styles.mobileMenuButton,
        styles.mobileMenuButtonClose
      )}
      {...props}
      ref={ref}
    >
      <svg
        aria-hidden='true'
        focusable='false'
        width='32'
        height='32'
        viewBox='0 0 16 16'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          d='M1 1L15 15'
          stroke='currentColor'
          strokeWidth='1'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M1 15L15 1'
          stroke='currentColor'
          strokeWidth='1'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    </button>
  );
});

export const Nav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const navigationId = 'primary-navigation';

  const closeMenu = useCallback((restoreFocus = true) => {
    setIsOpen(false);

    if (restoreFocus) {
      requestAnimationFrame(() => openButtonRef.current?.focus());
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 900px)');
    setIsMobile(mediaQuery.matches);

    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      const navHasFocus = navRef.current?.contains(document.activeElement);
      setIsMobile(event.matches);

      if (!event.matches && isOpen) {
        setIsOpen(false);
        requestAnimationFrame(() => {
          navRef.current?.querySelector<HTMLAnchorElement>('a')?.focus();
        });
      } else if (event.matches && !isOpen && navHasFocus) {
        openButtonRef.current?.focus();
      }
    };

    mediaQuery.addEventListener('change', handleBreakpointChange);

    return () => {
      mediaQuery.removeEventListener('change', handleBreakpointChange);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const body = document.body;
    const page = document.querySelector<HTMLElement>('.page-container');
    const previousOverflow = body.style.overflow;
    const previousHeight = body.style.height;
    const pageWasInert = page?.inert ?? false;

    body.style.overflow = 'hidden';
    body.style.height = '100vh';

    if (page) {
      page.inert = true;
    }

    const getFocusableElements = () => {
      const navLinks = Array.from(
        navRef.current?.querySelectorAll<HTMLElement>('a[href]') ?? []
      );
      const emailLink = document.querySelector<HTMLElement>(
        `.${styles.backdropEmail} a[href]`
      );

      return [closeButtonRef.current, ...navLinks, emailLink].filter(
        (element): element is HTMLElement => Boolean(element)
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements();
      const currentIndex = focusableElements.indexOf(
        document.activeElement as HTMLElement
      );

      if (focusableElements.length === 0) {
        return;
      }

      const nextIndex =
        currentIndex === -1
          ? event.shiftKey
            ? focusableElements.length - 1
            : 0
          : event.shiftKey
          ? (currentIndex - 1 + focusableElements.length) %
            focusableElements.length
          : (currentIndex + 1) % focusableElements.length;

      event.preventDefault();
      focusableElements[nextIndex]?.focus();
    };

    document.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      body.style.overflow = previousOverflow;
      body.style.height = previousHeight;

      if (page) {
        page.inert = pageWasInert;
      }
    };
  }, [closeMenu, isOpen]);

  return (
    <div
      aria-label={isOpen ? 'Site navigation' : undefined}
      aria-modal={isOpen ? true : undefined}
      className={styles.navContainer}
      role={isOpen ? 'dialog' : undefined}
    >
      <div
        aria-hidden={!isOpen}
        className={classNames(
          styles.backdrop,
          recursive.className,
          isOpen && styles.backdropOpen
        )}
        onClick={(event) => closeMenu(event.detail === 0)}
        {...(!isOpen ? { inert: '' } : {})}
      >
        <div className={styles.backdropInner}>
          <div className={styles.backdropName}>Max David</div>
          <div className={styles.backdropEmail}>
            <Link href='mailto:me@maxdavid.com'>me@maxdavid.com</Link>
          </div>
          <MobileMenuClose
            aria-label='Close navigation'
            disabled={!isOpen}
            ref={closeButtonRef}
          />
        </div>
      </div>
      <nav
        aria-label='Primary navigation'
        aria-hidden={isMobile && !isOpen}
        className={classNames(styles.nav, isOpen && styles.mobileOpen)}
        id={navigationId}
        ref={navRef}
        {...(isMobile && !isOpen ? { inert: '' } : {})}
      >
        <div className={styles.navInner}>
          <ul>
            <li className={styles.link}>
              <Link href='https://linkedin.com/in/maxdavid' target='linkedin'>
                linkedin
              </Link>
            </li>
            <li className={classNames(styles.link)}>
              <Link href='/MaxDavid_resume.pdf'>resume</Link>
            </li>
          </ul>
        </div>
      </nav>
      <MobileMenuOpen
        aria-controls={navigationId}
        aria-expanded={isOpen}
        aria-label='Open navigation'
        disabled={isOpen}
        onClick={() => setIsOpen(true)}
        ref={openButtonRef}
      />
    </div>
  );
};
