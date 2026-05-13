import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface D3LinearViewerProps {
    data: any;
    activeLine?: number | null;
    history?: any[];
}

export default function D3LinearViewer({ data, activeLine, history }: D3LinearViewerProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!svgRef.current || !data) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const isStack = data.metadata.diagramType === 'STACK';

        // Extract elements and associate them with their latest debug data
        const elements = data.entities.filter((e: any) => e.data.type === 'Instance' || e.data.type === 'Object');
        
        // Enrich elements with data from history
        const enrichedElements = elements.map((e: any) => {
            const debugInfo = history?.findLast(h => h.line === e.data.startLine);
            return {
                ...e,
                debugData: debugInfo?.data
            };
        });

        const visibleElements = enrichedElements.filter((e: any) => {
            if (!activeLine) return true;
            return (e.data.startLine || 0) <= activeLine;
        });

        const margin = { top: 50, right: 50, bottom: 50, left: 50 };
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        if (isStack) {
            renderStack(g, visibleElements, activeLine);
        } else {
            renderQueue(g, visibleElements, activeLine);
        }

    }, [data, activeLine, history]);

    const showTooltip = (event: any, d: any) => {
        if (!tooltipRef.current) return;
        const tooltip = d3.select(tooltipRef.current);
        
        const content = d.debugData 
            ? `<strong>${d.data.label}</strong><br/><pre>${JSON.stringify(d.debugData, null, 2)}</pre>`
            : `<strong>${d.data.label}</strong><br/>(No runtime data yet)`;

        tooltip.html(content)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px")
            .style("opacity", 1);
    };

    const hideTooltip = () => {
        if (!tooltipRef.current) return;
        d3.select(tooltipRef.current).style("opacity", 0);
    };

    const renderStack = (g: any, elements: any[], activeLine: any) => {
        const itemHeight = 60;
        const itemWidth = 240;
        const spacing = 10;
        const stackX = 100;
        const stackBottom = 500;

        // Container
        g.append("path")
            .attr("d", `M${stackX},100 L${stackX},${stackBottom} L${stackX + itemWidth + 20},${stackBottom} L${stackX + itemWidth + 20},100`)
            .attr("fill", "none")
            .attr("stroke", "#475569")
            .attr("stroke-width", 4);

        const nodes = g.selectAll(".stack-item")
            .data(elements, (d: any) => d.id)
            .join(
                (enter: any) => {
                    const group = enter.append("g")
                        .attr("class", "stack-item")
                        .attr("cursor", "pointer")
                        .attr("transform", (d: any, i: number) => `translate(${stackX + 10}, -100)`)
                        .on("mouseover", showTooltip)
                        .on("mousemove", showTooltip)
                        .on("mouseout", hideTooltip);

                    group.append("rect")
                        .attr("width", itemWidth)
                        .attr("height", itemHeight)
                        .attr("rx", 8)
                        .attr("fill", (d: any) => d.data.startLine === activeLine ? "#eab308" : "#3b82f6")
                        .attr("stroke", "#fff")
                        .attr("stroke-width", 2);

                    group.append("text")
                        .attr("x", itemWidth / 2)
                        .attr("y", itemHeight / 2)
                        .attr("dy", ".35em")
                        .attr("text-anchor", "middle")
                        .attr("fill", "#fff")
                        .attr("font-weight", "bold")
                        .text((d: any) => {
                            const val = d.debugData ? JSON.stringify(d.debugData) : "";
                            return d.data.label + (val.length > 0 ? " " + val : "");
                        })
                        .style("font-size", "12px");

                    group.transition()
                        .duration(500)
                        .attr("transform", (d: any, i: number) => `translate(${stackX + 10}, ${stackBottom - (i + 1) * (itemHeight + spacing)})`);
                    
                    return group;
                },
                (update: any) => update.transition()
                    .duration(300)
                    .attr("transform", (d: any, i: number) => `translate(${stackX + 10}, ${stackBottom - (i + 1) * (itemHeight + spacing)})`)
                    .select("rect")
                    .attr("fill", (d: any) => d.data.startLine === activeLine ? "#eab308" : "#3b82f6"),
                (exit: any) => exit.transition()
                    .duration(500)
                    .attr("transform", `translate(${stackX + 10}, -100)`)
                    .remove()
            );
    };

    const renderQueue = (g: any, elements: any[], activeLine: any) => {
        const itemHeight = 80;
        const itemWidth = 140;
        const spacing = 15;
        const queueY = 200;

        const nodes = g.selectAll(".queue-item")
            .data(elements, (d: any) => d.id)
            .join(
                (enter: any) => {
                    const group = enter.append("g")
                        .attr("class", "queue-item")
                        .attr("cursor", "pointer")
                        .attr("transform", (d: any, i: number) => `translate(800, ${queueY})`)
                        .on("mouseover", showTooltip)
                        .on("mousemove", showTooltip)
                        .on("mouseout", hideTooltip);

                    group.append("rect")
                        .attr("width", itemWidth)
                        .attr("height", itemHeight)
                        .attr("rx", 8)
                        .attr("fill", (d: any) => d.data.startLine === activeLine ? "#eab308" : "#22c55e")
                        .attr("stroke", "#fff")
                        .attr("stroke-width", 2);

                    group.append("text")
                        .attr("x", itemWidth / 2)
                        .attr("y", itemHeight / 2)
                        .attr("dy", ".35em")
                        .attr("text-anchor", "middle")
                        .attr("fill", "#fff")
                        .attr("font-weight", "bold")
                        .text((d: any) => {
                            const val = d.debugData ? JSON.stringify(d.debugData) : "";
                            return d.data.label + (val.length > 0 ? " " + val : "");
                        })
                        .style("font-size", "10px");

                    group.transition()
                        .duration(500)
                        .attr("transform", (d: any, i: number) => `translate(${i * (itemWidth + spacing)}, ${queueY})`);
                    
                    return group;
                },
                (update: any) => update.transition()
                    .duration(300)
                    .attr("transform", (d: any, i: number) => `translate(${i * (itemWidth + spacing)}, ${queueY})`)
                    .select("rect")
                    .attr("fill", (d: any) => d.data.startLine === activeLine ? "#eab308" : "#22c55e"),
                (exit: any) => exit.transition()
                    .duration(500)
                    .attr("transform", `translate(-200, ${queueY})`)
                    .remove()
            );
    };

    return (
        <div style={{ width: '100%', height: '100%', background: '#0f172a', overflow: 'hidden', position: 'relative' }}>
            <div style={{ padding: '20px', color: '#60a5fa', fontWeight: 'bold' }}>
                {data.metadata.diagramType} Visualization (D3.js)
            </div>
            <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid meet" />
            <div ref={tooltipRef} style={{
                position: 'absolute',
                padding: '10px',
                background: 'rgba(30, 41, 59, 0.95)',
                color: 'white',
                borderRadius: '6px',
                pointerEvents: 'none',
                opacity: 0,
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #475569',
                zIndex: 1000,
                maxWidth: '300px'
            }} />
        </div>
    );
}
