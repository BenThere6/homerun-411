import React from 'react';
import Svg, { Path } from 'react-native-svg';

export default function HomePlateIcon_Selected({ color = "#999", size = 24 }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill={color} // This fills the shape
    >
      <Path d="M10 10 H90 V60 L50 90 L10 60 Z" />
    </Svg>
  );
}
