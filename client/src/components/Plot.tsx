import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  ScatterController,
  Tooltip,
  Legend,
  Title,
  SubTitle,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  ScatterController,
  Tooltip,
  Legend,
  Title,
  SubTitle
);

interface PlotProps {
  title: string;
  subtitle?: string;
  x_label: string;
  y_label: string;
  x_axis: number[];
  y_axis: number[];
  teams: string[];
  fit_slope: number;
  fit_intercept: number;
}

const Plot: React.FC<PlotProps> = ({
  title,
  subtitle,
  x_label,
  y_label,
  x_axis,
  y_axis,
  teams,
  fit_slope,
  fit_intercept,
}) => {
  // Create scatter plot data points
  const scatterData = x_axis.map((x, index) => ({
    x: x,
    y: y_axis[index],
  }));

  // Calculate best fit line points
  const minX = Math.min(...x_axis);
  const maxX = Math.max(...x_axis);
  const bestFitLineData = [
    { x: minX, y: fit_slope * minX + fit_intercept },
    { x: maxX, y: fit_slope * maxX + fit_intercept },
  ];

  // Calculate y-axis bounds based on data only
  const minY = Math.min(...y_axis);
  const maxY = Math.max(...y_axis);
  const yPadding = (maxY - minY) * 0.1; // 10% padding

  const data = {
    datasets: [
      {
        label: 'Data Points',
        data: scatterData,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Best Fit Line',
        data: bestFitLineData,
        type: 'line' as const,
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
        showLine: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 18,
        },
      },
      subtitle: {
        display: subtitle ? true : false,
        text: subtitle || '',
        font: {
          size: 14,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            if (context.datasetIndex === 0) {
              // Data points - show custom tooltip
              const index = context.dataIndex;
              const xValue = context.parsed.x.toFixed(2);
              const yValue = context.parsed.y.toFixed(4);
              const team = teams[index];
              return [
                `${x_label}: ${xValue}`,
                `${y_label}: ${yValue}`,
                `Team: ${team}`
              ];
            } else {
              // Best fit line - show default tooltip
              return `Best Fit Line`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: x_label,
          font: {
            size: 14,
          },
        },
      },
      y: {
        min: minY - yPadding,
        max: maxY + yPadding,
        title: {
          display: true,
          text: y_label,
          font: {
            size: 14,
          },
        },
      },
    },
  };

  return (
    <div style={{ width: '100%', maxWidth: '800px', height: '500px', margin: '2rem 0rem 0rem 0rem' }}>
      <Chart type="scatter" data={data} options={options} />
    </div>
  );
};

export default Plot;
