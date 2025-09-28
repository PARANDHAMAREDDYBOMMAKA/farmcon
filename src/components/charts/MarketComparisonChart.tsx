'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface MarketData {
  market: string
  price: number
  state: string
  trend?: string
}

interface MarketComparisonChartProps {
  data: MarketData[]
  title: string
  type?: 'best' | 'worst'
}

export default function MarketComparisonChart({ data, title, type = 'best' }: MarketComparisonChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!data || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove() // Clear previous chart

    const margin = { top: 20, right: 30, bottom: 60, left: 60 }
    const width = 400 - margin.left - margin.right
    const height = 300 - margin.bottom - margin.top

    const chart = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Scales
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.market.split(' ').slice(0, 2).join(' '))) // Shorten market names
      .range([0, width])
      .padding(0.2)

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.price) || 0])
      .nice()
      .range([height, 0])

    // Color scale
    const colorScale = d3.scaleOrdinal()
      .domain(data.map(d => d.market))
      .range(type === 'best'
        ? ['#10b981', '#059669', '#047857', '#065f46'] // Green shades for best
        : ['#ef4444', '#dc2626', '#b91c1c', '#991b1b'] // Red shades for worst
      )

    // Bars
    chart.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.market.split(' ').slice(0, 2).join(' ')) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('fill', d => colorScale(d.market) as string)
      .attr('rx', 4)
      .attr('ry', 4)
      .on('mouseover', function(event, d) {
        // Tooltip
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '8px 12px')
          .style('border-radius', '6px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
          .style('opacity', 0)

        tooltip.transition().duration(200).style('opacity', 1)

        tooltip.html(`
          <div><strong>${d.market}</strong></div>
          <div>${d.state}</div>
          <div>₹${d.price.toLocaleString()}/quintal</div>
          ${d.trend ? `<div>Trend: ${d.trend === 'up' ? '📈' : d.trend === 'down' ? '📉' : '➡️'} ${d.trend}</div>` : ''}
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')

        // Highlight bar
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 0.8)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2)
      })
      .on('mouseout', function() {
        // Remove tooltip
        d3.selectAll('.tooltip').remove()

        // Reset bar
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 1)
          .attr('stroke', 'none')
      })
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .attr('y', d => yScale(d.price))
      .attr('height', d => height - yScale(d.price))

    // Price labels on bars
    chart.selectAll('.price-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'price-label')
      .attr('x', d => (xScale(d.market.split(' ').slice(0, 2).join(' ')) || 0) + xScale.bandwidth() / 2)
      .attr('y', height)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('fill', 'white')
      .text(d => `₹${d.price.toLocaleString()}`)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100 + 500)
      .attr('y', d => yScale(d.price) + 15)

    // X Axis
    chart.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '10px')

    // Y Axis
    chart.append('g')
      .call(d3.axisLeft(yScale)
        .tickFormat(d => `₹${d3.format(',.0f')(d as number)}`))
      .style('font-size', '10px')

    // Y Axis Label
    chart.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text('Price (₹/Quintal)')

    // Title
    chart.append('text')
      .attr('x', width / 2)
      .attr('y', 0 - (margin.top / 2))
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text(title)

    // Add trend arrows
    data.forEach((d, i) => {
      if (d.trend && d.trend !== 'stable') {
        const x = (xScale(d.market.split(' ').slice(0, 2).join(' ')) || 0) + xScale.bandwidth() - 15
        const y = yScale(d.price) - 10

        chart.append('text')
          .attr('x', x)
          .attr('y', y)
          .attr('font-size', '14px')
          .text(d.trend === 'up' ? '📈' : '📉')
          .style('opacity', 0)
          .transition()
          .duration(500)
          .delay(i * 100 + 1000)
          .style('opacity', 1)
      }
    })

  }, [data, title, type])

  return (
    <div className="flex justify-center items-center w-full">
      <svg ref={svgRef} className="w-full max-w-md h-80"></svg>
    </div>
  )
}