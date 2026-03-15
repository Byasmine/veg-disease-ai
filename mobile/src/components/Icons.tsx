import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const DEFAULT_SIZE = 22;
const HEADER_SIZE = 24;

type IconProps = { size?: number; color?: string };

export const IconLeaf = ({ size = DEFAULT_SIZE, color = colors.olive }: IconProps) => (
  <Ionicons name="leaf" size={size} color={color} />
);
export const IconCamera = ({ size = DEFAULT_SIZE, color = colors.olive }: IconProps) => (
  <Ionicons name="camera-outline" size={size} color={color} />
);
export const IconImages = ({ size = DEFAULT_SIZE, color = colors.olive }: IconProps) => (
  <Ionicons name="images-outline" size={size} color={color} />
);
export const IconScan = ({ size = DEFAULT_SIZE, color = colors.textOnOlive }: IconProps) => (
  <Ionicons name="scan-outline" size={size} color={color} />
);
export const IconSuccess = ({ size = DEFAULT_SIZE, color = colors.success }: IconProps) => (
  <Ionicons name="checkmark-circle" size={size} color={color} />
);
export const IconWarning = ({ size = DEFAULT_SIZE, color = colors.warning }: IconProps) => (
  <Ionicons name="warning" size={size} color={color} />
);
export const IconError = ({ size = DEFAULT_SIZE, color = colors.danger }: IconProps) => (
  <Ionicons name="close-circle" size={size} color={color} />
);
export const IconBulb = ({ size = DEFAULT_SIZE, color = colors.taupe }: IconProps) => (
  <Ionicons name="bulb-outline" size={size} color={color} />
);
export const IconMedical = ({ size = DEFAULT_SIZE, color = colors.taupe }: IconProps) => (
  <Ionicons name="medical-outline" size={size} color={color} />
);
export const IconList = ({ size = DEFAULT_SIZE, color = colors.taupe }: IconProps) => (
  <Ionicons name="list-outline" size={size} color={color} />
);
export const IconThumbsUp = ({ size = DEFAULT_SIZE, color = colors.success }: IconProps) => (
  <Ionicons name="thumbs-up-outline" size={size} color={color} />
);
export const IconThumbsDown = ({ size = DEFAULT_SIZE, color = colors.danger }: IconProps) => (
  <Ionicons name="thumbs-down-outline" size={size} color={color} />
);
export const IconHeart = ({ size = DEFAULT_SIZE, color = colors.olive }: IconProps) => (
  <Ionicons name="heart-outline" size={size} color={color} />
);
export const IconChat = ({ size = DEFAULT_SIZE, color = colors.taupe }: IconProps) => (
  <Ionicons name="chatbubble-outline" size={size} color={color} />
);
export const IconSend = ({ size = DEFAULT_SIZE, color = colors.textOnOlive }: IconProps) => (
  <Ionicons name="send-outline" size={size} color={color} />
);
export const IconBack = ({ size = HEADER_SIZE, color = colors.textOnOlive }: IconProps) => (
  <Ionicons name="arrow-back" size={size} color={color} />
);
export const IconAlert = ({ size = DEFAULT_SIZE, color = colors.danger }: IconProps) => (
  <Ionicons name="warning-outline" size={size} color={color} />
);
export const IconDocument = ({ size = DEFAULT_SIZE, color = colors.taupe }: IconProps) => (
  <Ionicons name="document-text-outline" size={size} color={color} />
);
