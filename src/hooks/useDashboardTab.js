import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const hasTab = (validTabs, tab) => validTabs.includes(tab);

const useDashboardTab = ({ validTabs, defaultTab }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = hasTab(validTabs, requestedTab) ? requestedTab : defaultTab;

  useEffect(() => {
    if (hasTab(validTabs, requestedTab)) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", defaultTab);
    setSearchParams(nextParams, { replace: true });
  }, [defaultTab, requestedTab, searchParams, setSearchParams, validTabs]);

  const setActiveTab = useCallback(
    (nextTab) => {
      if (!hasTab(validTabs, nextTab)) return;
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("tab", nextTab);
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams, validTabs]
  );

  return {
    activeTab,
    setActiveTab,
  };
};

export default useDashboardTab;

