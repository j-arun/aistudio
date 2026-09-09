import React, { useState } from 'react';
import { Header } from './components/Header';
import { StudioView } from './components/StudioView';
import { WorkbenchView } from './components/WorkbenchView';
import { ConfigLogsView } from './components/ConfigLogsView';
import { AskMeModal } from './components/AskMeModal';
import { PdfIngestModal } from './components/PdfIngestModal';
import { ResourceMonitorPane } from './components/ResourceMonitorPane';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'workbench' | 'config'>('studio');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isAskMeModalOpen, setIsAskMeModalOpen] = useState(false);
  const [isResourceMonitorOpen, setIsResourceMonitorOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isIngestingPdf, setIsIngestingPdf] = useState(false);

  const handleRehydrateSample = () => {
    setIsIngestingPdf(true);
    setTimeout(() => {
      setIsIngestingPdf(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Persistent Header with Seval Kodi Emblem, Brand Title, Action Buttons, and Navigation Tabs */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        onOpenAskMeModal={() => setIsAskMeModalOpen(true)}
        onToggleResourceMonitor={() => setIsResourceMonitorOpen((prev) => !prev)}
        isResourceMonitorOpen={isResourceMonitorOpen}
        isListening={isListening}
        isIngestingPdf={isIngestingPdf}
      />

      {/* Main Viewport: Memory states preserved across tab switches */}
      <main className="flex-1 pb-10">
        <div style={{ display: activeTab === 'studio' ? 'block' : 'none' }}>
          <StudioView />
        </div>

        <div style={{ display: activeTab === 'workbench' ? 'block' : 'none' }}>
          <WorkbenchView onOpenResourceMonitor={() => setIsResourceMonitorOpen(true)} />
        </div>

        <div style={{ display: activeTab === 'config' ? 'block' : 'none' }}>
          <ConfigLogsView />
        </div>
      </main>

      {/* Floating 32B Private LLM Resource Monitor Helper Pane */}
      <ResourceMonitorPane
        isOpen={isResourceMonitorOpen}
        onClose={() => setIsResourceMonitorOpen(false)}
        isFloating={true}
      />

      {/* Component 4: Local Audio & Ephemeris Engine ("Ask Me") Modal */}
      <AskMeModal
        isOpen={isAskMeModalOpen}
        onClose={() => setIsAskMeModalOpen(false)}
        onNavigateToWorkbench={() => {
          setActiveTab('workbench');
          setIsAskMeModalOpen(false);
        }}
      />

      {/* Component 1: Tamil PDF Ingest Pipeline Modal */}
      <PdfIngestModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onRehydrateSample={handleRehydrateSample}
      />
    </div>
  );
}
