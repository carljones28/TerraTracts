import React, { useState, useEffect } from 'react';
import { runAllDiagnostics } from '../../lib/diagnostics';
import { performanceMonitor } from '../../lib/performanceUtils';
import { getRecentErrors, ErrorType } from '../../lib/errorHandling';
import { getResourceTimingMetrics } from '../../lib/perfMonitoring';

/**
 * DiagnosticsPanel component for displaying system diagnostics
 * This is a developer tool and should only be enabled in development mode
 */
const DiagnosticsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'system' | 'performance' | 'errors'>('system');
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Tab styling
  const tabStyle = 'px-4 py-2 cursor-pointer';
  const activeTabStyle = `${tabStyle} font-bold border-b-2 border-blue-500`;
  const inactiveTabStyle = `${tabStyle} text-gray-500 hover:text-gray-700 hover:bg-gray-100`;
  
  // Run diagnostics
  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const diagnostics = await runAllDiagnostics();
      setDiagnosticsData(diagnostics);
      
      // Get performance metrics
      setPerformanceData(performanceMonitor.getAllMetrics());
      
      // Get recent errors
      setErrors(getRecentErrors(10));
      
      // Get resource timing
      setResources(getResourceTimingMetrics().slice(0, 20)); // Limit to 20 resources
    } catch (error) {
      console.error('Error running diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Reload data every 10 seconds when panel is open
  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
      
      const interval = setInterval(runDiagnostics, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);
  
  // Format duration in milliseconds
  const formatDuration = (ms: number) => {
    if (ms < 1) return '<1ms';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  // Get status color
  const getStatusColor = (status: 'healthy' | 'degraded' | 'unavailable') => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'unavailable': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };
  
  // Get error type color
  const getErrorTypeColor = (type: ErrorType) => {
    switch (type) {
      case ErrorType.NETWORK: return 'bg-red-100 text-red-800';
      case ErrorType.API: return 'bg-orange-100 text-orange-800';
      case ErrorType.VALIDATION: return 'bg-yellow-100 text-yellow-800';
      case ErrorType.PERMISSION: return 'bg-purple-100 text-purple-800';
      case ErrorType.TIMEOUT: return 'bg-blue-100 text-blue-800';
      case ErrorType.OPENAI: return 'bg-green-100 text-green-800';
      case ErrorType.ANTHROPIC: return 'bg-indigo-100 text-indigo-800';
      case ErrorType.MAPBOX: return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Render System tab content
  const renderSystemTab = () => {
    if (!diagnosticsData) {
      return <div className="p-4">Loading diagnostics data...</div>;
    }
    
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">System Status</h3>
        
        {/* API Services */}
        <div className="mb-6">
          <h4 className="font-medium mb-2">API Services</h4>
          <div className="bg-gray-50 p-4 rounded-md">
            {Object.entries(diagnosticsData.apiHealth).map(([endpoint, data]: [string, any]) => (
              <div key={endpoint} className="mb-2 flex items-center justify-between">
                <span className="font-mono text-sm truncate flex-1">{endpoint}</span>
                <span className={`ml-2 ${getStatusColor(data.status)}`}>
                  {data.status} ({formatDuration(data.responseTime)})
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* External Services */}
        <div className="mb-6">
          <h4 className="font-medium mb-2">External Services</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-md ${diagnosticsData.openai ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="font-medium">OpenAI</div>
              <div className={diagnosticsData.openai ? 'text-green-600' : 'text-red-600'}>
                {diagnosticsData.openai ? 'Connected' : 'Disconnected'}
              </div>
            </div>
            
            <div className={`p-4 rounded-md ${diagnosticsData.anthropic ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="font-medium">Anthropic</div>
              <div className={diagnosticsData.anthropic ? 'text-green-600' : 'text-red-600'}>
                {diagnosticsData.anthropic ? 'Connected' : 'Disconnected'}
              </div>
            </div>
            
            <div className={`p-4 rounded-md ${diagnosticsData.mapbox ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="font-medium">MapBox</div>
              <div className={diagnosticsData.mapbox ? 'text-green-600' : 'text-red-600'}>
                {diagnosticsData.mapbox ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Environment Info */}
        <div>
          <h4 className="font-medium mb-2">Environment</h4>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-2">
              <div>Browser:</div>
              <div className="font-mono text-sm">{navigator.userAgent}</div>
              
              <div>Screen Resolution:</div>
              <div className="font-mono text-sm">{window.innerWidth}x{window.innerHeight}</div>
              
              <div>Mode:</div>
              <div className="font-mono text-sm">{import.meta.env.MODE}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render Performance tab content
  const renderPerformanceTab = () => {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
        
        {/* Component performance */}
        <div className="mb-6">
          <h4 className="font-medium mb-2">Component Rendering</h4>
          <div className="bg-gray-50 p-4 rounded-md">
            {Object.entries(performanceData)
              .filter(([key]) => key.startsWith('component.'))
              .map(([key, value]) => (
                <div key={key} className="mb-2 flex items-center justify-between">
                  <span>{key.replace('component.', '')}</span>
                  <span className={value > 100 ? 'text-yellow-500' : 'text-green-500'}>
                    {formatDuration(value)}
                  </span>
                </div>
              ))}
            {Object.entries(performanceData).filter(([key]) => key.startsWith('component.')).length === 0 && (
              <div className="text-gray-500">No component metrics recorded yet</div>
            )}
          </div>
        </div>
        
        {/* API performance */}
        <div className="mb-6">
          <h4 className="font-medium mb-2">API Calls</h4>
          <div className="bg-gray-50 p-4 rounded-md">
            {Object.entries(performanceData)
              .filter(([key]) => key.startsWith('api.'))
              .map(([key, value]) => (
                <div key={key} className="mb-2 flex items-center justify-between">
                  <span>{key.replace('api.', '')}</span>
                  <span className={value > 3000 ? 'text-yellow-500' : 'text-green-500'}>
                    {formatDuration(value)}
                  </span>
                </div>
              ))}
            {Object.entries(performanceData).filter(([key]) => key.startsWith('api.')).length === 0 && (
              <div className="text-gray-500">No API metrics recorded yet</div>
            )}
          </div>
        </div>
        
        {/* Resource timing */}
        <div>
          <h4 className="font-medium mb-2">Resource Timing (Top 20)</h4>
          <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="pb-2 pr-4">Resource</th>
                  <th className="pb-2 px-4">Type</th>
                  <th className="pb-2 px-4">Duration</th>
                  <th className="pb-2 px-4">Size</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((resource, index) => (
                  <tr key={index} className={resource.isSlowResource ? 'text-yellow-600' : ''}>
                    <td className="py-1 pr-4 truncate max-w-[200px]">{resource.name.split('/').pop()}</td>
                    <td className="py-1 px-4">{resource.initiatorType}</td>
                    <td className="py-1 px-4">{formatDuration(resource.duration)}</td>
                    <td className="py-1 px-4">{Math.round(resource.transferSize / 1024)} KB</td>
                  </tr>
                ))}
                {resources.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">
                      No resource timing data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  // Render Errors tab content
  const renderErrorsTab = () => {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Recent Errors</h3>
        
        {errors.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-md">
            <div className="text-green-500 font-medium mb-2">No errors recorded 🎉</div>
            <div className="text-gray-500 text-sm">The application is running smoothly</div>
          </div>
        ) : (
          <div className="space-y-4">
            {errors.map((error, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getErrorTypeColor(error.type)}`}>
                    {error.type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="font-medium mb-1">{error.message}</div>
                {error.endpoint && (
                  <div className="text-sm text-gray-600 mb-1">
                    Endpoint: <span className="font-mono">{error.endpoint}</span>
                  </div>
                )}
                {error.statusCode && (
                  <div className="text-sm text-gray-600">
                    Status: <span className="font-mono">{error.statusCode}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setErrors([])}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm"
          >
            Clear Errors
          </button>
        </div>
      </div>
    );
  };
  
  // Only show in development mode or if forcefully enabled
  if (import.meta.env.MODE !== 'development' && !localStorage.getItem('enableDiagnostics')) {
    return null;
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-3 shadow-lg"
        title="System Diagnostics"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      
      {/* Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-end justify-center sm:items-center p-4">
          <div className="fixed inset-0 bg-black/30" onClick={() => setIsOpen(false)}></div>
          
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">System Diagnostics</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            
            {/* Tabs */}
            <div className="border-b flex">
              <div
                className={activeTab === 'system' ? activeTabStyle : inactiveTabStyle}
                onClick={() => setActiveTab('system')}
              >
                System
              </div>
              <div
                className={activeTab === 'performance' ? activeTabStyle : inactiveTabStyle}
                onClick={() => setActiveTab('performance')}
              >
                Performance
              </div>
              <div
                className={activeTab === 'errors' ? activeTabStyle : inactiveTabStyle}
                onClick={() => setActiveTab('errors')}
              >
                Errors
                {errors.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {errors.length}
                  </span>
                )}
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-auto">
              {loading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              )}
              
              {activeTab === 'system' && renderSystemTab()}
              {activeTab === 'performance' && renderPerformanceTab()}
              {activeTab === 'errors' && renderErrorsTab()}
            </div>
            
            {/* Footer */}
            <div className="px-4 py-3 border-t bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
              <div>Last updated: {new Date().toLocaleTimeString()}</div>
              <button
                onClick={runDiagnostics}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                disabled={loading}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DiagnosticsPanel;