import { useState, useCallback } from 'react';
import TopBar from './components/TopBar';
import GraphCanvas from './components/GraphCanvas';
import ChatPanel from './components/ChatPanel';
import NodeInspector from './components/NodeInspector';
import { useGraph } from './hooks/useGraph';
import { useChat } from './hooks/useChat';
import { GitBranch, RefreshCw } from 'lucide-react';
import type { GraphNode } from './types';

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
  const [showGranular, setShowGranular] = useState(true);
  const [nodePosition, setNodePosition] = useState<{ x: number; y: number } | undefined>();

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

  const handleNodeClick = useCallback((node: GraphNode, position: { x: number; y: number }) => {
    setSelectedNode(node);
    setNodePosition(position);
  }, [setSelectedNode]);

  const handleCloseInspector = useCallback(() => {
    setSelectedNode(null);
    setNodePosition(undefined);
  }, [setSelectedNode]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center border"
              style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
              <GitBranch className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            </div>
            <div className="absolute -inset-2 rounded-2xl border-2"
              style={{
                borderColor: 'transparent',
                borderTopColor: 'var(--accent)',
                animation: 'spin-slow 1.5s linear infinite',
              }}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Loading graph data...
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Building Order to Cash model
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
        <div className="text-center p-8 rounded-2xl border max-w-sm animate-fade-in-up"
          style={{ borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Connection Error
          </p>
          <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <button onClick={reloadGraph}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 active:scale-95"
            style={{ background: 'var(--accent)', color: '#fff' }}>
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
        showGranular={showGranular}
        onToggleGranular={() => setShowGranular(!showGranular)}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="relative flex-1">
          <GraphCanvas
            graphData={graphData}
            selectedNode={selectedNode}
            highlightedNodes={highlightedNodes}
            activeFilters={activeFilters}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={expandNode}
          />
          {selectedNode && (
            <NodeInspector
              node={selectedNode}
              onClose={handleCloseInspector}
              onExpand={expandNode}
              position={nodePosition}
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
