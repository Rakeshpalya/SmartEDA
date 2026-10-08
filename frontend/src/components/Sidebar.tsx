import React from 'react';
import {
  Home, Table2, Search, Type, HelpCircle, CopyX, Sparkles,
  Columns, PieChart, BarChart2, Activity, Calculator, Layers,
  GitCompare, Cpu, Target, Award, ArrowLeftRight, Lightbulb,
  CheckSquare, FileText, ChevronRight
} from 'lucide-react';

export type NavTabId =
  | 'overview'
  | 'raw_data'
  | 'inspection'
  | 'data_types'
  | 'missing'
  | 'duplicates'
  | 'inconsistencies'
  | 'columns'
  | 'categorical'
  | 'numerical'
  | 'outliers'
  | 'statistics'
  | 'visualizations'
  | 'correlation'
  | 'preprocessing'
  | 'target'
  | 'ml'
  | 'before_after'
  | 'insights'
  | 'report';

interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
}) => {
  const navSections = [
    {
      group: 'Data Ingestion & Schema',
      items: [
        { id: 'overview' as NavTabId, label: 'Overview', icon: Home },
        { id: 'raw_data' as NavTabId, label: 'Raw Data Table', icon: Table2 },
        { id: 'inspection' as NavTabId, label: 'Data Inspection', icon: Search },
        { id: 'data_types' as NavTabId, label: 'Data Types', icon: Type },
      ],
    },
    {
      group: 'Cleaning & Quality (EDA)',
      items: [
        { id: 'missing' as NavTabId, label: 'Missing Values', icon: HelpCircle },
        { id: 'duplicates' as NavTabId, label: 'Duplicate Analysis', icon: CopyX },
        { id: 'inconsistencies' as NavTabId, label: 'Inconsistent Values', icon: Sparkles },
        { id: 'outliers' as NavTabId, label: 'Outlier Detection', icon: Activity },
        { id: 'columns' as NavTabId, label: 'Column Cleaning', icon: Columns },
      ],
    },
    {
      group: 'Statistical EDA & Charts',
      items: [
        { id: 'categorical' as NavTabId, label: 'Categorical Analysis', icon: PieChart },
        { id: 'numerical' as NavTabId, label: 'Numerical Analysis', icon: BarChart2 },
        { id: 'statistics' as NavTabId, label: 'Descriptive Statistics', icon: Calculator },
        { id: 'correlation' as NavTabId, label: 'Correlation Heatmap', icon: GitCompare },
        { id: 'visualizations' as NavTabId, label: 'Visualization Studio', icon: Layers },
      ],
    },
    {
      group: 'Preprocessing & Machine Learning',
      items: [
        { id: 'preprocessing' as NavTabId, label: 'Preprocessing Pipeline', icon: Layers },
        { id: 'target' as NavTabId, label: 'Target Analysis', icon: Target },
        { id: 'ml' as NavTabId, label: 'Machine Learning', icon: Cpu },
      ],
    },
    {
      group: 'Evaluation & Final Output',
      items: [
        { id: 'before_after' as NavTabId, label: 'Before vs After Cleaning', icon: ArrowLeftRight },
        { id: 'insights' as NavTabId, label: 'Automated Insights', icon: Lightbulb },
        { id: 'report' as NavTabId, label: 'Final Project Report', icon: FileText },
      ],
    },
  ];

  return (
    <aside
      className={`w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-[calc(100vh-4rem)] sticky top-16 transition-all duration-200 z-20 overflow-y-auto ${
        isOpen ? 'block' : 'hidden md:block'
      }`}
    >
      <div className="p-3 space-y-6">
        {navSections.map((section, sIdx) => (
          <div key={sIdx}>
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {section.group}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
