import React from 'react';
import Chart from './Chart';
import { ChartElement } from '@/types';

export const renderChartElement = (element: ChartElement, props: any = {}) => {
    return <Chart element={element} {...props} />;
};
