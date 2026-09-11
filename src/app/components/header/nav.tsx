'use client';

import classNames from 'classnames';
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@/app/components';
import { recursive } from '@/app/fonts';
import styles from './header.module.scss';

const MOBILE_QUERY = '(max-width: 900px)';

const navigationLinks = [
  {
    href: 'https://linkedin.com/in/maxdavid',
    key: 'linkedin',
    label: 'linkedin',
    target: 'linkedin',
  },
  {
    href: '/MaxDavid_resume.pdf',
    key: 'resume',
    label: 'resume',
  },
] as const;

const useBrowserLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

const MobileMenuButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: 'open' | 'close' }
>(function MobileMenuButton({ icon, onKeyDown, ...props }, ref) {
  const isOpenIcon = icon === 'open';

  return (
    <button
      className={classNames(
        styles.mobileMenuButton,
        !isOpenIcon && styles.mobileMenuButtonClose
      )}
      onKeyDown={(event) => {
        if (event.repeat && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          return;
        }

        onKeyDown?.(event);
      }}
      {...props}
      ref={ref}
    >
      <svg
        aria-hidden='true'
        focusable='false'
        width='32'
        height='32'
        viewBox={isOpenIcon ? '0 0 16 12' : '0 0 16 16'}
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        {isOpenIcon ? (
          <>
            <path d='M1 2H15' />
            <path d='M1 6H15' />
            <path d='M1 10H15' />
          </>
        ) : (
          <>
            <path d='M1 1L15 15' />
            <path d='M1 15L15 1' />
          </>
        )}
      </svg>
    </button>
  );
});

type BodyStyles = Pick<
  CSSStyleDeclaration,
  'left' | 'overflow' | 'position' | 'right' | 'top' | 'width'
>;

type NavigationFocus = {
  context: 'desktop' | 'mobile' | 'opener';
  key?: string;
};

export const Nav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
  const mobileSurfaceRef = useRef<HTMLDivElement | null>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isOpenRef = useRef(false);
  const lastNavigationFocusRef = useRef<NavigationFocus | null>(null);
  const pointerStartedOnBackdropRef = useRef(false);
  const backdropPointerIdRef = useRef<number | null>(null);
  const pointerEndedOnBackdropRef = useRef(false);
  const pendingFocusRef = useRef<HTMLElement | null>(null);
  const backgroundInertRef = useRef<Map<HTMLElement, boolean> | null>(null);
  const bodyStylesRef = useRef<BodyStyles | null>(null);
  const scrollPositionRef = useRef({ x: 0, y: 0 });

  const desktopNavigationId = 'desktop-primary-navigation';
  const mobileDialogId = 'mobile-navigation-dialog';
  const mobileNavigationId = 'mobile-primary-navigation';

  const setMobileSurfaceRef = useCallback((surface: HTMLDivElement | null) => {
    mobileSurfaceRef.current = surface;
    if (!surface) return;

    surface.inert = true;
    surface.setAttribute('aria-hidden', 'true');
    surface.removeAttribute('aria-modal');
  }, []);

  const setBackgroundInert = useCallback((inert: boolean) => {
    if (inert) {
      if (backgroundInertRef.current) return;

      const elements = [
        document.querySelector<HTMLElement>('header'),
        document.querySelector<HTMLElement>('.page-container'),
      ].filter((element): element is HTMLElement => Boolean(element));

      backgroundInertRef.current = new Map(
        elements.map((element) => [element, element.inert])
      );
      elements.forEach((element) => {
        element.inert = true;
      });
      return;
    }

    backgroundInertRef.current?.forEach((wasInert, element) => {
      element.inert = wasInert;
    });
    backgroundInertRef.current = null;
  }, []);

  const setScrollLocked = useCallback((locked: boolean) => {
    const body = document.body;

    if (locked) {
      if (bodyStylesRef.current) return;

      scrollPositionRef.current = { x: window.scrollX, y: window.scrollY };
      bodyStylesRef.current = {
        left: body.style.left,
        overflow: body.style.overflow,
        position: body.style.position,
        right: body.style.right,
        top: body.style.top,
        width: body.style.width,
      };

      body.style.position = 'fixed';
      body.style.top = `${-scrollPositionRef.current.y}px`;
      body.style.left = `${-scrollPositionRef.current.x}px`;
      body.style.right = '0';
      body.style.width = '100%';
      body.style.overflow = 'hidden';
      return;
    }

    if (!bodyStylesRef.current) return;

    Object.assign(body.style, bodyStylesRef.current);
    bodyStylesRef.current = null;
    window.scrollTo(scrollPositionRef.current.x, scrollPositionRef.current.y);
  }, []);

  const openMenu = useCallback(() => {
    if (isOpenRef.current) return;

    isOpenRef.current = true;
    setIsOpen(true);
  }, []);

  const closeMenu = useCallback((focusTarget?: HTMLElement | null) => {
    if (!isOpenRef.current) return;

    pendingFocusRef.current =
      focusTarget === undefined ? openButtonRef.current : focusTarget;
    isOpenRef.current = false;
    setIsOpen(false);
  }, []);

  useBrowserLayoutEffect(() => {
    setPortalTarget(document.body);

    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    setIsMobile(mediaQuery.matches);

    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      const activeElement = document.activeElement as HTMLElement | null;
      const focusFellBackToBody =
        !activeElement || activeElement === document.body;
      const lastNavigationFocus = focusFellBackToBody
        ? lastNavigationFocusRef.current
        : null;

      if (!event.matches) {
        const mobileLinkKey =
          activeElement
            ?.closest<HTMLElement>('[data-navigation-key]')
            ?.dataset.navigationKey ??
          (lastNavigationFocus?.context === 'mobile'
            ? lastNavigationFocus.key
            : undefined);
        const focusWasInMobileSurface = Boolean(
          activeElement && mobileSurfaceRef.current?.contains(activeElement)
        ) || lastNavigationFocus?.context === 'mobile';
        const openerHadFocus =
          activeElement === openButtonRef.current ||
          lastNavigationFocus?.context === 'opener';

        if (focusWasInMobileSurface || openerHadFocus) {
          pendingFocusRef.current =
            (mobileLinkKey
              ? desktopNavRef.current?.querySelector<HTMLElement>(
                  `[data-navigation-key='${mobileLinkKey}']`
                )
              : null) ??
            desktopNavRef.current?.querySelector<HTMLElement>('a[href]') ??
            null;
        }

        isOpenRef.current = false;
        setIsOpen(false);
      } else if (
        (activeElement && desktopNavRef.current?.contains(activeElement)) ||
        lastNavigationFocus?.context === 'desktop'
      ) {
        pendingFocusRef.current = openButtonRef.current;
      }

      setIsMobile(event.matches);
    };

    mediaQuery.addEventListener('change', handleBreakpointChange);
    return () => mediaQuery.removeEventListener('change', handleBreakpointChange);
  }, []);

  useBrowserLayoutEffect(() => {
    const surface = mobileSurfaceRef.current;
    if (!surface) return;

    if (isMobile && isOpen) {
      surface.inert = false;
      surface.removeAttribute('aria-hidden');
      surface.setAttribute('aria-modal', 'true');
      setScrollLocked(true);
      setBackgroundInert(true);
      closeButtonRef.current?.focus({ preventScroll: true });

      const getFocusableElements = () =>
        Array.from(
          surface.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
          )
        );

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          closeMenu();
          return;
        }

        if (event.key !== 'Tab') return;

        const focusableElements = getFocusableElements();
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (!firstElement || !lastElement) {
          event.preventDefault();
          return;
        }

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      };

      const handleFocusIn = (event: FocusEvent) => {
        if (!surface.contains(event.target as Node)) {
          closeButtonRef.current?.focus({ preventScroll: true });
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('focusin', handleFocusIn);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('focusin', handleFocusIn);
      };
    }

    setBackgroundInert(false);
    setScrollLocked(false);
    pendingFocusRef.current?.focus({ preventScroll: true });
    pendingFocusRef.current = null;
    surface.inert = true;
    surface.setAttribute('aria-hidden', 'true');
    surface.removeAttribute('aria-modal');
  }, [closeMenu, isMobile, isOpen, setBackgroundInert, setScrollLocked]);

  useBrowserLayoutEffect(
    () => () => {
      setBackgroundInert(false);
      setScrollLocked(false);
    },
    [setBackgroundInert, setScrollLocked]
  );

  const mobileSurface = (
    <div
      aria-label='Site navigation'
      className={classNames(styles.mobileSurface, recursive.className)}
      data-open={isMobile && isOpen}
      id={mobileDialogId}
      onClick={(event) => {
        if (
          pointerStartedOnBackdropRef.current &&
          pointerEndedOnBackdropRef.current &&
          event.target === event.currentTarget
        ) {
          closeMenu();
        }
        pointerStartedOnBackdropRef.current = false;
        pointerEndedOnBackdropRef.current = false;
        backdropPointerIdRef.current = null;
      }}
      onPointerDown={(event) => {
        const startedOnBackdrop = event.target === event.currentTarget;
        pointerStartedOnBackdropRef.current = startedOnBackdrop;
        pointerEndedOnBackdropRef.current = false;
        backdropPointerIdRef.current = startedOnBackdrop
          ? event.pointerId
          : null;
      }}
      onPointerUp={(event) => {
        pointerEndedOnBackdropRef.current =
          backdropPointerIdRef.current === event.pointerId &&
          event.target === event.currentTarget;
      }}
      onPointerCancel={() => {
        pointerStartedOnBackdropRef.current = false;
        pointerEndedOnBackdropRef.current = false;
        backdropPointerIdRef.current = null;
      }}
      ref={setMobileSurfaceRef}
      role='dialog'
    >
      <div className={styles.mobileSurfaceHeader}>
        <div className={styles.mobileSurfaceName}>Max David</div>
        <MobileMenuButton
          aria-label='Close navigation'
          icon='close'
          onClick={() => closeMenu()}
          onFocus={() => {
            lastNavigationFocusRef.current = { context: 'mobile' };
          }}
          ref={closeButtonRef}
          type='button'
        />
      </div>
      <div className={styles.mobilePanel}>
        <nav aria-label='Primary navigation' id={mobileNavigationId}>
          <ul>
            {navigationLinks.map((link) => (
              <li className={styles.link} key={link.key}>
                <Link
                  data-navigation-key={link.key}
                  href={link.href}
                  onClick={() => closeMenu(null)}
                  onFocus={() => {
                    lastNavigationFocusRef.current = {
                      context: 'mobile',
                      key: link.key,
                    };
                  }}
                  target={'target' in link ? link.target : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className={styles.mobileSurfaceEmail}>
        <Link
          href='mailto:me@maxdavid.com'
          onClick={() => closeMenu(null)}
          onFocus={() => {
            lastNavigationFocusRef.current = { context: 'mobile' };
          }}
        >
          me@maxdavid.com
        </Link>
      </div>
    </div>
  );

  return (
    <div className={styles.navContainer}>
      <nav
        aria-label='Primary navigation'
        className={styles.desktopNav}
        id={desktopNavigationId}
        ref={desktopNavRef}
      >
        <ul>
          {navigationLinks.map((link) => (
            <li className={styles.link} key={link.key}>
              <Link
                data-navigation-key={link.key}
                href={link.href}
                onFocus={() => {
                  lastNavigationFocusRef.current = {
                    context: 'desktop',
                    key: link.key,
                  };
                }}
                target={'target' in link ? link.target : undefined}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <MobileMenuButton
        aria-controls={mobileDialogId}
        aria-expanded={isMobile && isOpen}
        aria-label='Open navigation'
        icon='open'
        onClick={openMenu}
        onFocus={() => {
          lastNavigationFocusRef.current = { context: 'opener' };
        }}
        ref={openButtonRef}
        type='button'
      />
      {portalTarget && createPortal(mobileSurface, portalTarget)}
    </div>
  );
};
