import { TabView, TabPanel } from 'primereact/tabview';
import styles from './TabsLayout.module.css';

export type TabItem = { id: string; label: string };

type TabsLayoutProps = {
  activeTabId: string;
  onTabChange: (id: string) => void;
  tabs: TabItem[];
};

export function TabsLayout({ activeTabId, onTabChange, tabs }: TabsLayoutProps) {
  const activeIndex = tabs.findIndex((t) => t.id === activeTabId);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;

  return (
    <div className={styles.tabStrip}>
      <TabView
        activeIndex={safeIndex}
        onTabChange={(e) => onTabChange(tabs[e.index]?.id ?? '')}
      >
        {tabs.map((tab) => (
          <TabPanel key={tab.id} header={tab.label}>
            <></>
          </TabPanel>
        ))}
      </TabView>
    </div>
  );
}
