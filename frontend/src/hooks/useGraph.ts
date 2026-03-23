import { useState, useEffect, useCallback } from 'react';
import type { GraphData, GraphNode } from '../types';
import { fetchGraph, fetchNeighbors } from '../utils/api';

export function useGraph() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadGraph();
  }, []);

  const loadGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGraph(true);
      setGraphData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load graph');
    } finally {
      setLoading(false);
    }
  }, []);

  const expandNode = useCallback(async (nodeId: string) => {
    try {
      const neighborData = await fetchNeighbors(nodeId, 1);

      setGraphData(prev => {
        const existingNodeIds = new Set(prev.nodes.map(n => n.id));
        const existingEdgeKeys = new Set(prev.links.map(l => `${l.source}-${l.target}`));

        const newNodes = neighborData.nodes.filter(n => !existingNodeIds.has(n.id));
        const newLinks = neighborData.links.filter(
          l => !existingEdgeKeys.has(`${l.source}-${l.target}`)
        );

        return {
          nodes: [...prev.nodes, ...newNodes],
          links: [...prev.links, ...newLinks],
        };
      });
    } catch (e) {
      console.error('Failed to expand node:', e);
    }
  }, []);

  const highlightNodes = useCallback((nodeIds: string[]) => {
    setHighlightedNodes(new Set(nodeIds));
  }, []);

  const clearHighlights = useCallback(() => {
    setHighlightedNodes(new Set());
  }, []);

  return {
    graphData,
    loading,
    error,
    selectedNode,
    setSelectedNode,
    highlightedNodes,
    highlightNodes,
    clearHighlights,
    expandNode,
    reloadGraph: loadGraph,
  };
}
