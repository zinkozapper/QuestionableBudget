import React from 'react';

// Simple Pie Chart Component using SVG
export function PieChart({ data, title, colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const startAngle = (cumulativePercentage / 100) * 360;
    const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
    
    const startAngleRad = (startAngle - 90) * (Math.PI / 180);
    const endAngleRad = (endAngle - 90) * (Math.PI / 180);
    
    const largeArcFlag = percentage > 50 ? 1 : 0;
    
    const x1 = 100 + 80 * Math.cos(startAngleRad);
    const y1 = 100 + 80 * Math.sin(startAngleRad);
    const x2 = 100 + 80 * Math.cos(endAngleRad);
    const y2 = 100 + 80 * Math.sin(endAngleRad);
    
    const pathData = [
      `M 100 100`,
      `L ${x1} ${y1}`,
      `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    cumulativePercentage += percentage;
    
    return {
      ...item,
      pathData,
      percentage: percentage.toFixed(1),
      color: colors[index % colors.length]
    };
  });

  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-content">
        <svg width="200" height="200" viewBox="0 0 200 200" className="pie-chart">
          {slices.map((slice, index) => (
            <path
              key={index}
              d={slice.pathData}
              fill={slice.color}
              stroke="white"
              strokeWidth="2"
              className="chart-slice"
            />
          ))}
        </svg>
        <div className="chart-legend">
          {slices.map((slice, index) => (
            <div key={index} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: slice.color }}
              />
              <span className="legend-label">{slice.label}</span>
              <span className="legend-value">{slice.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Simple Bar Chart Component
export function BarChart({ data, title, color = '#3b82f6' }) {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <div className="bar-chart">
        {data.map((item, index) => (
          <div key={index} className="bar-item">
            <div className="bar-label">{item.label}</div>
            <div className="bar-container">
              <div 
                className="bar-fill"
                style={{ 
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: color
                }}
              />
              <span className="bar-value">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Line Chart Component for trends
export function LineChart({ data, title, color = '#3b82f6' }) {
  const maxValue = Math.max(...data.map(item => item.value));
  const minValue = Math.min(...data.map(item => item.value));
  const range = maxValue - minValue;
  
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 300;
    const y = 150 - ((item.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <div className="line-chart">
        <svg width="100%" height="200" viewBox="0 0 300 200">
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="3"
            className="line-path"
          />
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 300;
            const y = 150 - ((item.value - minValue) / range) * 100;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill={color}
                className="data-point"
              />
            );
          })}
        </svg>
        <div className="line-chart-labels">
          {data.map((item, index) => (
            <div key={index} className="line-label">
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Donut Chart Component
export function DonutChart({ data, title, colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const startAngle = (cumulativePercentage / 100) * 360;
    const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
    
    const startAngleRad = (startAngle - 90) * (Math.PI / 180);
    const endAngleRad = (endAngle - 90) * (Math.PI / 180);
    
    const largeArcFlag = percentage > 50 ? 1 : 0;
    
    const x1 = 100 + 60 * Math.cos(startAngleRad);
    const y1 = 100 + 60 * Math.sin(startAngleRad);
    const x2 = 100 + 60 * Math.cos(endAngleRad);
    const y2 = 100 + 60 * Math.sin(endAngleRad);
    
    const pathData = [
      `M 100 100`,
      `L ${x1} ${y1}`,
      `A 60 60 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    cumulativePercentage += percentage;
    
    return {
      ...item,
      pathData,
      percentage: percentage.toFixed(1),
      color: colors[index % colors.length]
    };
  });

  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-content">
        <svg width="200" height="200" viewBox="0 0 200 200" className="donut-chart">
          <circle cx="100" cy="100" r="40" fill="white" stroke="#e5e7eb" strokeWidth="2"/>
          {slices.map((slice, index) => (
            <path
              key={index}
              d={slice.pathData}
              fill={slice.color}
              stroke="white"
              strokeWidth="2"
              className="chart-slice"
            />
          ))}
        </svg>
        <div className="chart-legend">
          {slices.map((slice, index) => (
            <div key={index} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: slice.color }}
              />
              <span className="legend-label">{slice.label}</span>
              <span className="legend-value">{slice.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
