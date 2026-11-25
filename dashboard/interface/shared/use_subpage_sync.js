import { useEffect } from 'react';

export function useSubpageSync(activeSubPage, setLocalTab, onChangeSubPage) {
  useEffect(() => {
    if (activeSubPage && typeof setLocalTab === 'function') {
      setLocalTab(activeSubPage);
    }
  }, [activeSubPage, setLocalTab]);

  const selectTab = (tabKey) => {
    if (typeof setLocalTab === 'function') {
      setLocalTab(tabKey);
    }
    if (typeof onChangeSubPage === 'function') {
      onChangeSubPage(tabKey);
    }
  };

  return { selectTab };
}
