import { AlertTriangle, AlertOctagon } from 'lucide-react';

interface DashboardProps {
  warnings: number;
  errors: number;
}

export default function Dashboard({ warnings, errors }: DashboardProps) {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">
          <span className="code-icon">&lt;/&gt;</span> CodeVision
        </h2>
      </div>
      <div className="dashboard-metrics">

        <div className="metric-card warning">
          <div className="metric-icon"><AlertTriangle size={20} color="#facc15" /></div>
          <div className="metric-info">
            <span className="metric-value">{warnings}</span>
            <span className="metric-label">Code Smells</span>
          </div>
        </div>

        <div className="metric-card error">
          <div className="metric-icon"><AlertOctagon size={20} color="#ef4444" /></div>
          <div className="metric-info">
            <span className="metric-value">{errors}</span>
            <span className="metric-label">Errors</span>
          </div>
        </div>

      </div>
    </div>
  );
}
