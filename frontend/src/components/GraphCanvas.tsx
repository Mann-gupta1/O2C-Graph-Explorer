import { useRef, useCallback, useEffect, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, Maximize, RotateCcw } from 'lucide-react';
import type { GraphData, GraphNode } from '../types';
import { getNodeColor, getNodeSize } from '../utils/colors';

interface GraphCanvasProps {
  graphData: GraphData;
  selectedNode: GraphNode | null;
  highlightedNodes: Set<string>;
  activeFilters: Set<string>;
  onNodeClick: (node: GraphNode, position: { x: number; y: number }) => void;
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
      fgRef.current.d3Force('charge')?.strength(-140);
      fgRef.current.d3Force('link')?.distance(65);
    }
  }, [filteredData]);

  const handleNodeClick = useCallback(
    (node: ForceGraphNode, event: MouseEvent) => {
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
        onNodeClick(graphNode, { x: event.clientX, y: event.clientY });

        if (fgRef.current) {
          fgRef.current.centerAt(node.x, node.y, 600);
          fgRef.current.zoom(2.5, 600);
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
        ctx.arc(node.x!, node.y!, size + 6, 0, 2 * Math.PI);
        ctx.fillStyle = baseColor + '18';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, size + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = baseColor + '50';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
      ctx.fillStyle = baseColor;
      ctx.fill();

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, size + 1.5, 0, 2 * Math.PI);
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (globalScale > 1.8 || isSelected || isHighlighted) {
        const label = node.label.length > 18 ? node.label.slice(0, 16) + '..' : node.label;
        const fontSize = Math.max(10 / globalScale, 3);
        ctx.font = `500 ${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#374151';
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
      ctx.strokeStyle = isHighlighted ? '#6366f1' : 'rgba(147, 197, 253, 0.35)';
      ctx.lineWidth = isHighlighted ? 2 : 0.8;
      ctx.stroke();
    },
    [highlightedNodes]
  );

  const handleZoomIn = () => fgRef.current?.zoom(fgRef.current.zoom() * 1.4, 300);
  const handleZoomOut = () => fgRef.current?.zoom(fgRef.current.zoom() / 1.4, 300);
  const handleFit = () => fgRef.current?.zoomToFit(400, 40);
  const handleReset = () => {
    fgRef.current?.centerAt(0, 0, 400);
    fgRef.current?.zoom(1, 400);
  };

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ background: '#fafbfd' }}>
      <div className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: 'radial-gradient(ellipse at 60% 40%, rgba(147, 197, 253, 0.08) 0%, transparent 60%)',
        }}
      />
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
        backgroundColor="rgba(0,0,0,0)"
      />

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1.5 rounded-xl border z-10"
        style={{
          background: 'var(--bg-primary)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-md)',
        }}>
        <button onClick={handleZoomOut}
          className="p-1.5 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          style={{ color: 'var(--text-secondary)' }}>
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-4" style={{ background: 'var(--border-color)' }} />
        <span className="px-2 text-[11px] font-medium min-w-[40px] text-center" style={{ color: 'var(--text-secondary)' }}>
          100%
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border-color)' }} />
        <button onClick={handleZoomIn}
          className="p-1.5 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          style={{ color: 'var(--text-secondary)' }}>
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-px h-4" style={{ background: 'var(--border-color)' }} />
        <button onClick={handleFit}
          className="p-1.5 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          style={{ color: 'var(--text-secondary)' }}>
          <Maximize className="w-4 h-4" />
        </button>
        <button onClick={handleReset}
          className="p-1.5 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          style={{ color: 'var(--text-secondary)' }}>
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
