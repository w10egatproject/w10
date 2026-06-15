'use client';

import ReactSpeedometer from 'react-d3-speedometer';

type SpeedometerClientProps = {
  value: number;
  minValue: number;
  maxValue: number;
  segments: number;
  customSegmentStops: number[];
  segmentColors: string[];
  needleColor: string;
  needleHeightRatio: number;
  startColor: string;
  endColor: string;
  ringWidth: number;
  maxSegmentLabels: number;
  width: number;
  height: number;
  currentValueText: string;
  valueTextFontSize: string;
  textColor: string;
};

export default function SpeedometerClient(props: SpeedometerClientProps) {
  return <ReactSpeedometer {...props} />;
}
