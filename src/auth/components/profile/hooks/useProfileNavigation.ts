import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RailKey,
  mobileAfterHomeKeys,
  mobileBeforeHomeKeys,
  mobilePrimaryKeys,
  railItems,
} from '../config';

interface UseProfileNavigationParams {
  copy: {
    nav: {
      home: string;
      personalInfo: string;
      contactInfo: string;
      security: string;
      twoFactor: string;
    };
  };
  isRtl: boolean;
  logout: () => Promise<void>;
}

export const useProfileNavigation = ({
  copy,
  isRtl,
  logout,
}: UseProfileNavigationParams) => {
  const router = useRouter();
  const [activeRail, setActiveRail] = useState<RailKey>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  const mobileBeforeHomeItems = useMemo(
    () => railItems.filter((item) => mobileBeforeHomeKeys.includes(item.key)),
    [],
  );
  const mobileAfterHomeItems = useMemo(
    () => railItems.filter((item) => mobileAfterHomeKeys.includes(item.key)),
    [],
  );
  const mobileHomeItem = useMemo(
    () => railItems.find((item) => item.key === 'home') || null,
    [],
  );
  const mobileOverflowItems = useMemo(
    () => railItems.filter((item) => !mobilePrimaryKeys.includes(item.key)),
    [],
  );

  const mobileMoreActive = useMemo(
    () => mobileOverflowItems.some((item) => item.key === activeRail),
    [activeRail, mobileOverflowItems],
  );

  const railLabels: Record<RailKey, string> = useMemo(
    () => ({
      home: copy.nav.home,
      'personal-info': copy.nav.personalInfo,
      'contact-info': copy.nav.contactInfo,
      security: copy.nav.security,
      'two-factor': copy.nav.twoFactor,
    }),
    [copy],
  );

  const normalizeRailKey = useCallback((value: string | string[] | undefined): RailKey => {
    const raw = Array.isArray(value) ? value[0] : value;
    if (!raw) return 'home';
    return railItems.some((item) => item.key === raw) ? (raw as RailKey) : 'home';
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const rawTab = Array.isArray(router.query.tab) ? router.query.tab[0] : router.query.tab;
    const queryRail = normalizeRailKey(router.query.tab);
    setActiveRail((previous) => (previous === queryRail ? previous : queryRail));

    if (!rawTab || queryRail !== rawTab) {
      void router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            tab: queryRail,
          },
        },
        undefined,
        { shallow: true, scroll: false },
      );
    }
  }, [normalizeRailKey, router]);

  const handleSectionNav = useCallback(
    (key: RailKey, _sectionId: string) => {
      setActiveRail(key);
      setMobileMenuOpen(false);

      if (!router.isReady) return;
      const currentRail = normalizeRailKey(router.query.tab);
      if (currentRail === key) return;

      void router.push(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            tab: key,
          },
        },
        undefined,
        { shallow: true, scroll: false },
      );
    },
    [normalizeRailKey, router],
  );

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    setMobileMenuOpen(false);
    void logout();
  }, [logout]);

  return {
    activeRail,
    mobileMenuOpen,
    setMobileMenuOpen,
    mobileMenuRef,
    mobileBeforeHomeItems,
    mobileAfterHomeItems,
    mobileHomeItem,
    mobileOverflowItems,
    mobileMoreActive,
    railLabels,
    handleSectionNav,
    closeMobileMenu,
    handleLogout,
    toggleCornerClass: isRtl ? 'left-4' : 'right-4',
  };
};
