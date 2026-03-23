import { useRef, useCallback, useEffect, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { GraphData, GraphNode } from '../types';
import { getNodeColor, getNodeSize } from '../utils/colors';

interface GraphCanvasProps {
  graphData: GraphData;
  selectedNode: GraphNode | null;
  highlightedNodes: Set<string>;
  activeFilters: Set<string>;
  onNodeClick: (node: GraphNode) => void;
  onNodeDoubleClick: (nodeId: string) => void;
}

interface ForceGraphNode {
  id: string;
  type: string;
  label: string;
  metadata: Record<string, unknown>;
  x?: number;
  y?: number;
}

const DOUBLE_CLICK_DELAY = 300;

export default function GraphCanvas({
  graphData,
  selectedNode,
  highlightedNodes,
  activeFilters,
  onNodeClick,
  onNodeDoubleClick,
}: GraphCanvasProps) {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastClickedNode = useRef<string | null>(null);

  const filteredData = useMemo(() => {
    if (activeFilters.size === 0) return graphData;

    const visibleNodeIds = new Set(
      graphData.nodes.filter(n => activeFilters.has(n.type)).map(n => n.id)
    );

    return {
      nodes: graphData.nodes.filter(n => visibleNodeIds.has(n.id)),
      links: graphData.links.filter(
        l => visibleNodeIds.has(l.source as string) && visibleNodeIds.has(l.target as string)
      ),
    };
  }, [graphData, activeFilters]);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge')?.strength(-120);
      fgRef.current.d3Force('link')?.distance(60);
    }
  }, [filteredData]);

  const handleNodeClick = useCallback(
    (node: ForceGraphNode) => {
      if (clickTimer.current && lastClickedNode.current === node.id) {
        clearTimeout(clickTimer.current);
        clickTimer.current = null;
        lastClickedNode.current = null;
        onNodeDoubleClick(node.id);
        return;
      }

      lastClickedNode.current = node.id;
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
        lastClickedNode.current = null;

        const graphNode: GraphNode = {
          id: node.id,
          type: node.type,
          label: node.label,
          metadata: node.metadata,
        };
        onNodeClick(graphNode);

        if (fgRef.current) {
          fgRef.current.centerAt(node.x, node.y, 500);
          fgRef.current.zoom(2.5, 500);
        }
      }, DOUBLE_CLICK_DELAY);
    },
    [onNodeClick, onNodeDoubleClick]
  );

  const nodeCanvasObject = useCallback(
    (node: ForceGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const isSelected = selectedNode?.id === node.id;
      const isHighlighted = highlightedNodes.has(node.id);
      const baseColor = getNodeColor(node.type);
      const size = getNodeSize(node.type);

      if (isHighlighted || isSelected) {
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, size + 4, 0, 2 * Math.PI);
        ctx.fillStyle = baseColor + '33';
        ctx.fill();
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected || isHighlighted ? baseColor : baseColor + 'cc';
      ctx.fill();

      if (globalScale > 1.5 || isSelected || isHighlighted) {
        const label = node.label.length > 20 ? node.label.slice(0, 18) + '..' : node.label;
        const fontSize = Math.max(10 / globalScale, 3);
        ctx.font = `${fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = isSelected || isHighlighted ? '#fff' : '#bbb';
        ctx.fillText(label, node.x!, node.y! + size + 3);
      }
    },
    [selectedNode, highlightedNodes]
  );

  const linkCanvasObject = useCallback(
    (link: any, ctx: CanvasRenderingContext2D) => {
      const src = link.source;
      const tgt = link.target;
      if (!src || !tgt || typeof src.x !== 'number') return;

      const isHighlighted =
        highlightedNodes.has(src.id) && highlightedNodes.has(tgt.id);

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.strokeStyle = isHighlighted ? '#6366f1' : '#1e1e4a';
      ctx.lineWidth = isHighlighted ? 1.5 : 0.5;
      ctx.stroke();
    },
    [highlightedNodes]
  );

  return (
    <div ref={containerRef} className="w-full h-full" style={{ background: 'var(--bg-primary)' }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={filteredData}
        nodeId="id"
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        onNodeClick={handleNodeClick}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        cooldownTicks={100}
        warmupTicks={50}
        backgroundColor="#06060e"
      />
    </div>
  );
}
