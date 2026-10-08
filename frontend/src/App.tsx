import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { DatasetSummary, PresentationSlide } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTabId } from './components/Sidebar';
import { PresentationModal } from './components/PresentationModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { OverviewPage } from './pages/OverviewPage';
import { RawDataPage } from './pages/RawDataPage';
import { InspectionPage } from './pages/InspectionPage';
import { DataTypesPage } from './pages/DataTypesPage';
import { MissingValuesPage } from './pages/MissingValuesPage';
import { DuplicatesPage } from './pages/DuplicatesPage';
import { InconsistenciesPage } from './pages/InconsistenciesPage';
import { ColumnCleanerPage } from './pages/ColumnCleanerPage';
import { CategoricalPage } from './pages/CategoricalPage';
import { NumericalPage } from './pages/NumericalPage';
import { OutlierPage } from './pages/OutlierPage';
import { DescriptiveStatsPage } from './pages/DescriptiveStatsPage';
import { CorrelationPage } from './pages/CorrelationPage';
import { VisualizationStudioPage } from './pages/VisualizationStudioPage';
import { PreprocessingPage } from './pages/PreprocessingPage';
import { TargetAnalysisPage } from './pages/TargetAnalysisPage';
import { MachineLearningPage } from './pages/MachineLearningPage';
import { BeforeAfterPage } from './pages/BeforeAfterPage';
import { InsightsPage } from './pages/InsightsPage';
import { ReportPage } from './pages/ReportPage';

export const App: React.FC = () => {
  const [isLandingPage, setIsLandingPage] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavTabId>('overview');
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Theme
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Presentation Modal
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [presentationSlides, setPresentationSlides] = useState<PresentationSlide[]>([]);

  // Sidebar toggle
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Initialize theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial load
  const refreshSummary = async () => {
    try {
      const res = await api.getOverview();
      setSummary(res);
    } catch (e) {
      console.warn("No active dataset yet or backend waking up.");
    }
  };

  useEffect(() => {
    refreshSummary();
  }, []);

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const res = await api.uploadFile(file);
      setSummary(res.overview);
      setIsLandingPage(false);
      setActiveTab('overview');
      alert(`New dataset '${file.name}' loaded successfully.`);
    } catch (e: any) {
      alert(`Upload error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    setIsLoading(true);
    try {
      const res = await api.loadDemoDataset();
      setSummary(res.overview);
      setIsLandingPage(false);
      setActiveTab('overview');
      alert("Built-in Student Performance demo dataset loaded successfully.");
    } catch (e: any) {
      alert(`Demo load failed: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDataset = async () => {
    if (!confirm("Revert dataset back to raw uncleaned upload? Any temporary cleaning operations will be reverted.")) return;
    setIsLoading(true);
    try {
      const res = await api.resetDataset();
      setSummary(res.overview);
      await refreshSummary();
      alert("Dataset reverted to original raw state.");
    } catch (e: any) {
      alert(`Reset error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPresentation = async () => {
    try {
      const slides = await api.getPresentationSlides();
      setPresentationSlides(slides);
      setIsPresentationOpen(true);
    } catch (e: any) {
      alert(`Could not load slides: ${e.message}`);
    }
  };

  if (isLandingPage) {
    return (
      <LandingPage
        onFileUpload={handleFileUpload}
        onLoadDemo={handleLoadDemo}
        onEnterDashboard={() => setIsLandingPage(false)}
        hasActiveDataset={!!summary}
        activeSummary={summary}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navigation */}
      <Navbar
        summary={summary}
        onResetRaw={handleResetDataset}
        onResetDemo={handleLoadDemo}
        onUploadFile={handleFileUpload}
        onOpenPresentation={handleOpenPresentation}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex w-full">
        {/* Collapsible Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(t) => setActiveTab(t)}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Content Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 xl:p-10 overflow-y-auto">
          {activeTab === 'overview' && summary && (
            <OverviewPage
              summary={summary}
              onNavigate={(tab) => setActiveTab(tab)}
              onUploadFile={handleFileUpload}
              onResetDemo={handleLoadDemo}
            />
          )}

          {activeTab === 'raw_data' && (
            <RawDataPage onRefreshSummary={refreshSummary} />
          )}

          {activeTab === 'inspection' && <InspectionPage />}

          {activeTab === 'data_types' && (
            <DataTypesPage onRefreshSummary={refreshSummary} />
          )}

          {activeTab === 'missing' && (
            <MissingValuesPage onRefreshSummary={refreshSummary} />
          )}

          {activeTab === 'duplicates' && (
            <DuplicatesPage onRefreshSummary={refreshSummary} />
          )}

          {activeTab === 'inconsistencies' && (
            <InconsistenciesPage onRefreshSummary={refreshSummary} />
          )}

          {activeTab === 'columns' && (
            <ColumnCleanerPage onRefreshSummary={refreshSummary} />
          )}

          {activeTab === 'categorical' && (
            <CategoricalPage onRefreshSummary={refreshSummary} />
          )}

          {activeTab === 'numerical' && <NumericalPage />}

          {activeTab === 'outliers' && (
            <OutlierPage onRefreshSummary={refreshSummary} />
          )}

          {activeTab === 'statistics' && <DescriptiveStatsPage />}

          {activeTab === 'visualizations' && <VisualizationStudioPage />}

          {activeTab === 'correlation' && <CorrelationPage />}

          {activeTab === 'preprocessing' && (
            <PreprocessingPage onNavigateToML={() => setActiveTab('ml')} />
          )}

          {activeTab === 'target' && <TargetAnalysisPage />}

          {activeTab === 'ml' && <MachineLearningPage />}

          {activeTab === 'before_after' && <BeforeAfterPage />}

          {activeTab === 'insights' && <InsightsPage />}

          {activeTab === 'report' && <ReportPage />}
        </main>
      </div>

      {/* Interactive Presentation Mode Modal */}
      <PresentationModal
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
        slides={presentationSlides}
      />
    </div>
  );
};

export default App;
