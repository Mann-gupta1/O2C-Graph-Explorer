import { useState, useCallback } from 'react';
import TopBar from './components/TopBar';
import GraphCanvas from './components/GraphCanvas';
import ChatPanel from './components/ChatPanel';
import NodeInspector from './components/NodeInspector';
import { useGraph } from './hooks/useGraph';
import { useChat } from './hooks/useChat';
import { Loader2 } from 'lucide-react';

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
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Loading graph data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center p-6 rounded-xl" style={{ background: 'var(--bg-panel)' }}>
          <p className="text-red-400 text-sm mb-3">Failed to load graph: {error}</p>
          <button onClick={reloadGraph}
            className="px-4 py-2 rounded-lg text-sm cursor-pointer"
            style={{ background: 'var(--accent)', color: '#fff' }}>
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
        <div className="w-[380px] shrink-0">
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
