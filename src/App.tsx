import React, { useState } from 'react';
import { Header } from './components/Header';
import { StudioView } from './components/StudioView';
import { WorkbenchView } from './components/WorkbenchView';
import { MonitoringObservabilityView } from './components/MonitoringObservabilityView';
import { ConfigLogsView } from './components/ConfigLogsView';
import { ResourceMonitorModal } from './components/ResourceMonitorModal';
import { HelpDocsModal } from './components/HelpDocsModal';
import { HoroscopeProvider } from './context/HoroscopeContext';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'workbench' | 'monitor' | 'config'>('studio');
  const [isResourceMonitorOpen, setIsResourceMonitorOpen] = useState(false);
  const [isHelpDocsOpen, setIsHelpDocsOpen] = useState(false);

  return (
    <HoroscopeProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
        {/* Persistent Header with Seval Kodi Emblem, Brand Title, Action Buttons, and Navigation Tabs */}
        <Header
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          onOpenResourceMonitor={() => setIsResourceMonitorOpen(true)}
          isResourceMonitorOpen={isResourceMonitorOpen}
          onOpenHelpDocs={() => setIsHelpDocsOpen(true)}
        />

        {/* Main Viewport: Memory states preserved across tab switches */}
        <main className="flex-1 pb-10">
          <div style={{ display: activeTab === 'studio' ? 'block' : 'none' }}>
            <StudioView />
          </div>

          <div style={{ display: activeTab === 'workbench' ? 'block' : 'none' }}>
            <WorkbenchView onOpenResourceMonitor={() => setIsResourceMonitorOpen(true)} />
          </div>

          <div style={{ display: activeTab === 'monitor' ? 'block' : 'none' }}>
            <MonitoringObservabilityView />
          </div>

          <div style={{ display: activeTab === 'config' ? 'block' : 'none' }}>
            <ConfigLogsView />
          </div>
        </main>

        {/* Pop-up Window 1: System Monitoring & Observability Modal (Optimal Headroom & VRAM Purge) */}
        <ResourceMonitorModal
          isOpen={isResourceMonitorOpen}
          onClose={() => setIsResourceMonitorOpen(false)}
        />

        {/* Pop-up Window 2: System Help & Specifications Modal (SRS & SDD Document with PDF Export) */}
        <HelpDocsModal
          isOpen={isHelpDocsOpen}
          onClose={() => setIsHelpDocsOpen(false)}
        />
      </div>
    </HoroscopeProvider>
  );
}

