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
      fgRef.current.d3Force('charge')?.strength(-150);
      fgRef.current.d3Force('link')?.distance(70);
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
        const pulseSize = size + 8;
        const gradient = ctx.createRadialGradient(
          node.x!, node.y!, size,
          node.x!, node.y!, pulseSize + 4
        );
        gradient.addColorStop(0, baseColor + '40');
        gradient.addColorStop(1, baseColor + '00');
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, pulseSize + 4, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x!, node.y!, size + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = baseColor + '80';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const nodeGradient = ctx.createRadialGradient(
        node.x! - size * 0.3, node.y! - size * 0.3, 0,
        node.x!, node.y!, size
      );
      nodeGradient.addColorStop(0, baseColor);
      nodeGradient.addColorStop(1, baseColor + 'aa');

      ctx.beginPath();
      ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected || isHighlighted ? baseColor : nodeGradient;
      ctx.fill();

      if (isSelected || isHighlighted) {
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (globalScale > 1.3 || isSelected || isHighlighted) {
        const label = node.label.length > 22 ? node.label.slice(0, 20) + '..' : node.label;
        const fontSize = Math.max(11 / globalScale, 3);
        ctx.font = `500 ${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const textWidth = ctx.measureText(label).width;
        const padding = 3;
        ctx.fillStyle = 'rgba(5, 5, 15, 0.75)';
        ctx.beginPath();
        ctx.roundRect(
          node.x! - textWidth / 2 - padding,
          node.y! + size + 2,
          textWidth + padding * 2,
          fontSize + padding,
          3
        );
        ctx.fill();

        ctx.fillStyle = isSelected || isHighlighted ? '#fff' : '#ccc';
        ctx.fillText(label, node.x!, node.y! + size + 3.5);
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

      if (isHighlighted) {
        ctx.strokeStyle = 'rgba(129, 140, 248, 0.5)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#6366f1';
        ctx.shadowBlur = 6;
      } else {
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
        ctx.lineWidth = 0.5;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;
    },
    [highlightedNodes]
  );

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ background: 'var(--bg-primary)' }}>
      <div className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: 'radial-gradient(ellipse at 30% 40%, rgba(99, 102, 241, 0.04) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(139, 92, 246, 0.03) 0%, transparent 50%)',
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
    </div>
  );
}
