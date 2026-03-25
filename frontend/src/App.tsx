import { useState, useCallback } from 'react';
import TopBar from './components/TopBar';
import GraphCanvas from './components/GraphCanvas';
import ChatPanel from './components/ChatPanel';
import NodeInspector from './components/NodeInspector';
import { useGraph } from './hooks/useGraph';
import { useChat } from './hooks/useChat';
import { Hexagon, RefreshCw } from 'lucide-react';

export default function App() {
  const {
    graphData,
    loading,
    error,
    selectedNode,
    setSelectedNode,
    highlightedNodes,
    highlightNodes,
    clearHighlights,
    expandNode,
    reloadGraph,
  } = useGraph();

  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  const handleNodesReferenced = useCallback(
    (nodeIds: string[]) => {
      highlightNodes(nodeIds);
      setTimeout(() => clearHighlights(), 8000);
    },
    [highlightNodes, clearHighlights]
  );

  const { messages, isLoading, sendMessage } = useChat(handleNodesReferenced);

  const toggleFilter = useCallback((type: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setActiveFilters(new Set());
    setSelectedNode(null);
    clearHighlights();
    reloadGraph();
  }, [setSelectedNode, clearHighlights, reloadGraph]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-5 animate-fade-in-up">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--gradient-1)', boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)' }}>
              <Hexagon className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
            <div className="absolute -inset-3 rounded-3xl border animate-spin"
              style={{
                borderColor: 'transparent',
                borderTopColor: 'var(--accent)',
                animation: 'spin-slow 2s linear infinite',
              }}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Building graph...
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Loading SAP O2C data
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center p-8 rounded-2xl glass glow-border max-w-sm animate-fade-in-up">
          <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(239, 68, 68, 0.12)' }}>
            <span className="text-red-400 text-xl">!</span>
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Connection Error</p>
          <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <button onClick={reloadGraph}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 active:scale-95"
            style={{
              background: 'var(--gradient-1)',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
            }}>
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <TopBar
        activeFilters={activeFilters}
        onToggleFilter={toggleFilter}
        onReset={handleReset}
        nodeCount={graphData.nodes.length}
        edgeCount={graphData.links.length}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="relative flex-1">
          <GraphCanvas
            graphData={graphData}
            selectedNode={selectedNode}
            highlightedNodes={highlightedNodes}
            activeFilters={activeFilters}
            onNodeClick={setSelectedNode}
            onNodeDoubleClick={expandNode}
          />
          {selectedNode && (
            <NodeInspector
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onExpand={expandNode}
            />
          )}
        </div>
        <div className="w-[400px] shrink-0">
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            onSendMessage={sendMessage}
          />
        </div>
      </div>
    </>
  );
}
