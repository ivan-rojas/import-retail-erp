import {
  Smartphone,
  Headphones,
  Cable,
  Battery,
  Shield,
  Package,
  Laptop,
  Tablet,
  Watch,
  Speaker,
  Wifi,
  HardDrive,
  Camera,
  Gamepad2,
  Monitor,
  Mouse,
  LucideIcon,
} from 'lucide-react'
import React from 'react'

export const CATEGORY_ICON_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'smartphone', label: 'Smartphone' },
  { value: 'headphones', label: 'Headphones' },
  { value: 'cable', label: 'Cable' },
  { value: 'battery', label: 'Battery' },
  { value: 'shield', label: 'Shield' },
  { value: 'package', label: 'Package' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'watch', label: 'Watch' },
  { value: 'speaker', label: 'Speaker' },
  { value: 'wifi', label: 'Wifi' },
  { value: 'hard-drive', label: 'Hard Drive' },
  { value: 'camera', label: 'Camera' },
  { value: 'gamepad', label: 'Gamepad' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'mouse', label: 'Mouse' },
]

const ICON_MAP: Record<string, LucideIcon> = {
  smartphone: Smartphone,
  headphones: Headphones,
  cable: Cable,
  battery: Battery,
  shield: Shield,
  package: Package,
  laptop: Laptop,
  tablet: Tablet,
  watch: Watch,
  speaker: Speaker,
  wifi: Wifi,
  'hard-drive': HardDrive,
  camera: Camera,
  gamepad: Gamepad2,
  monitor: Monitor,
  mouse: Mouse,
}

export function getCategoryIconComponent(icon?: string): LucideIcon {
  if (!icon) return Package
  return ICON_MAP[icon] ?? Package
}

export function renderCategoryIcon(icon?: string, className = 'h-4 w-4') {
  const Icon = getCategoryIconComponent(icon)
  return <Icon className={className} />
}

