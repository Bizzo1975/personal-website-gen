'use client';

import React from 'react';
import { 
  // Navigation & UI Icons
  HomeIcon,
  UserIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  Bars3Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  
  // Content Icons
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  
  // Social & Communication Icons
  ShareIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  BookmarkIcon,
  LinkIcon,
  PhoneIcon,
  
  // Media Icons
  PhotoIcon,
  FilmIcon,
  DocumentIcon,
  FolderIcon,
  CloudArrowUpIcon,
  ArrowDownTrayIcon,
  
  // Action Icons
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  ArrowTopRightOnSquareIcon,
  ArrowRightIcon,
  
  // Time & Calendar Icons
  ClockIcon,
  CalendarIcon,
  CalendarDaysIcon,
  
  // Tech & Development Icons
  CommandLineIcon,
  CpuChipIcon,
  ServerIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  BugAntIcon,
  
  // Business Icons
  ChartBarIcon,
  PresentationChartLineIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  
  // Weather & Nature Icons
  SunIcon,
  MoonIcon,
  CloudIcon,
  BoltIcon,
  FireIcon,
  
  // Utility Icons
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  TagIcon,
  FlagIcon,
  StarIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  SparklesIcon,
  
} from '@heroicons/react/24/outline';

import {
  // Solid variants for active states
  HomeIcon as HomeSolidIcon,
  UserIcon as UserSolidIcon,
  DocumentTextIcon as DocumentSolidIcon,
  CodeBracketIcon as CodeSolidIcon,
  EnvelopeIcon as EnvelopeSolidIcon,
  HeartIcon as HeartSolidIcon,
  BookmarkIcon as BookmarkSolidIcon,
  StarIcon as StarSolidIcon,
  CheckCircleIcon as CheckCircleSolidIcon,
  XCircleIcon as XCircleSolidIcon,
  ExclamationTriangleIcon as ExclamationTriangleSolidIcon,
  InformationCircleIcon as InformationCircleSolidIcon,
  SunIcon as SunSolidIcon,
  MoonIcon as MoonSolidIcon,
} from '@heroicons/react/24/solid';

// Icon size variants
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// Icon color variants
export type IconColor = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info'
  | 'muted'
  | 'current'
  | 'white'
  | 'black';

// Icon style variants
export type IconVariant = 'outline' | 'solid';

interface IconProps {
  name: string;
  size?: IconSize;
  color?: IconColor;
  variant?: IconVariant;
  className?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
  onClick?: () => void;
  title?: string;
}

// Icon registry with both outline and solid variants
const iconRegistry = {
  // Navigation & UI
  home: { outline: HomeIcon, solid: HomeSolidIcon },
  user: { outline: UserIcon, solid: UserSolidIcon },
  document: { outline: DocumentTextIcon, solid: DocumentSolidIcon },
  code: { outline: CodeBracketIcon, solid: CodeSolidIcon },
  envelope: { outline: EnvelopeIcon, solid: EnvelopeSolidIcon },
  settings: { outline: Cog6ToothIcon, solid: Cog6ToothIcon },
  search: { outline: MagnifyingGlassIcon, solid: MagnifyingGlassIcon },
  close: { outline: XMarkIcon, solid: XMarkIcon },
  menu: { outline: Bars3Icon, solid: Bars3Icon },
  'chevron-down': { outline: ChevronDownIcon, solid: ChevronDownIcon },
  'chevron-up': { outline: ChevronUpIcon, solid: ChevronUpIcon },
  'chevron-left': { outline: ChevronLeftIcon, solid: ChevronLeftIcon },
  'chevron-right': { outline: ChevronRightIcon, solid: ChevronRightIcon },
  
  // Content
  pencil: { outline: PencilIcon, solid: PencilIcon },
  trash: { outline: TrashIcon, solid: TrashIcon },
  eye: { outline: EyeIcon, solid: EyeIcon },
  'eye-slash': { outline: EyeSlashIcon, solid: EyeSlashIcon },
  plus: { outline: PlusIcon, solid: PlusIcon },
  minus: { outline: MinusIcon, solid: MinusIcon },
  check: { outline: CheckIcon, solid: CheckIcon },
  warning: { outline: ExclamationTriangleIcon, solid: ExclamationTriangleSolidIcon },
  info: { outline: InformationCircleIcon, solid: InformationCircleSolidIcon },
  'check-circle': { outline: CheckCircleIcon, solid: CheckCircleSolidIcon },
  'x-circle': { outline: XCircleIcon, solid: XCircleSolidIcon },
  
  // Social & Communication
  share: { outline: ShareIcon, solid: ShareIcon },
  heart: { outline: HeartIcon, solid: HeartSolidIcon },
  chat: { outline: ChatBubbleLeftIcon, solid: ChatBubbleLeftIcon },
  bookmark: { outline: BookmarkIcon, solid: BookmarkSolidIcon },
  link: { outline: LinkIcon, solid: LinkIcon },
  phone: { outline: PhoneIcon, solid: PhoneIcon },
  
  // Media
  photo: { outline: PhotoIcon, solid: PhotoIcon },
  film: { outline: FilmIcon, solid: FilmIcon },
  'document-file': { outline: DocumentIcon, solid: DocumentIcon },
  folder: { outline: FolderIcon, solid: FolderIcon },
  upload: { outline: CloudArrowUpIcon, solid: CloudArrowUpIcon },
  download: { outline: ArrowDownTrayIcon, solid: ArrowDownTrayIcon },
  
  // Actions
  play: { outline: PlayIcon, solid: PlayIcon },
  pause: { outline: PauseIcon, solid: PauseIcon },
  stop: { outline: StopIcon, solid: StopIcon },
  refresh: { outline: ArrowPathIcon, solid: ArrowPathIcon },
  undo: { outline: ArrowUturnLeftIcon, solid: ArrowUturnLeftIcon },
  'external-link': { outline: ArrowTopRightOnSquareIcon, solid: ArrowTopRightOnSquareIcon },
  'arrow-right': { outline: ArrowRightIcon, solid: ArrowRightIcon },
  
  // Time & Calendar
  clock: { outline: ClockIcon, solid: ClockIcon },
  calendar: { outline: CalendarIcon, solid: CalendarIcon },
  'calendar-days': { outline: CalendarDaysIcon, solid: CalendarDaysIcon },
  
  // Tech & Development
  terminal: { outline: CommandLineIcon, solid: CommandLineIcon },
  cpu: { outline: CpuChipIcon, solid: CpuChipIcon },
  server: { outline: ServerIcon, solid: ServerIcon },
  globe: { outline: GlobeAltIcon, solid: GlobeAltIcon },
  shield: { outline: ShieldCheckIcon, solid: ShieldCheckIcon },
  bug: { outline: BugAntIcon, solid: BugAntIcon },
  
  // Business
  chart: { outline: ChartBarIcon, solid: ChartBarIcon },
  presentation: { outline: PresentationChartLineIcon, solid: PresentationChartLineIcon },
  currency: { outline: CurrencyDollarIcon, solid: CurrencyDollarIcon },
  building: { outline: BuildingOfficeIcon, solid: BuildingOfficeIcon },
  'user-group': { outline: UserGroupIcon, solid: UserGroupIcon },
  academic: { outline: AcademicCapIcon, solid: AcademicCapIcon },
  briefcase: { outline: BriefcaseIcon, solid: BriefcaseIcon },
  
  // Weather & Nature
  sun: { outline: SunIcon, solid: SunSolidIcon },
  moon: { outline: MoonIcon, solid: MoonSolidIcon },
  cloud: { outline: CloudIcon, solid: CloudIcon },
  bolt: { outline: BoltIcon, solid: BoltIcon },
  fire: { outline: FireIcon, solid: FireIcon },
  
  // Utility
  filter: { outline: FunnelIcon, solid: FunnelIcon },
  adjustments: { outline: AdjustmentsHorizontalIcon, solid: AdjustmentsHorizontalIcon },
  tag: { outline: TagIcon, solid: TagIcon },
  flag: { outline: FlagIcon, solid: FlagIcon },
  star: { outline: StarIcon, solid: StarSolidIcon },
  'thumb-up': { outline: HandThumbUpIcon, solid: HandThumbUpIcon },
  'thumb-down': { outline: HandThumbDownIcon, solid: HandThumbDownIcon },
  sparkles: { outline: SparklesIcon, solid: SparklesIcon },
  
  // Additional icons
  x: { outline: XMarkIcon, solid: XMarkIcon },
  'document-text': { outline: DocumentTextIcon, solid: DocumentSolidIcon },
  mail: { outline: EnvelopeIcon, solid: EnvelopeSolidIcon },
};

// Size classes mapping
const sizeClasses: Record<IconSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
};

// Color classes mapping
const colorClasses: Record<IconColor, string> = {
  primary: 'text-primary-600 dark:text-primary-400',
  secondary: 'text-secondary-600 dark:text-secondary-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  error: 'text-red-600 dark:text-red-400',
  info: 'text-blue-600 dark:text-blue-400',
  muted: 'text-slate-500 dark:text-slate-400',
  current: 'text-current',
  white: 'text-white',
  black: 'text-black',
};

// Main Icon component
export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color = 'current',
  variant = 'outline',
  className = '',
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  onClick,
  title,
}) => {
  const iconConfig = iconRegistry[name as keyof typeof iconRegistry];
  
  if (!iconConfig) {
    console.warn(`Icon "${name}" not found in registry`);
    return null;
  }
  
  const IconComponent = iconConfig[variant] || iconConfig.outline;
  
  const classes = [
    sizeClasses[size],
    colorClasses[color],
    onClick ? 'cursor-pointer' : '',
    className,
  ].filter(Boolean).join(' ');
  
  const iconProps = {
    className: classes,
    'aria-label': ariaLabel,
    'aria-hidden': ariaHidden ?? (!ariaLabel && !title),
    onClick,
    title,
  };
  
  return <IconComponent {...iconProps} />;
};

// Utility component for icon buttons
interface IconButtonProps extends Omit<IconProps, 'onClick'> {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  'aria-label': string; // Required for buttons
}

export const IconButton: React.FC<IconButtonProps> = ({
  disabled = false,
  loading = false,
  className = '',
  onClick,
  ...iconProps
}) => {
  const buttonClasses = [
    'inline-flex items-center justify-center',
    'rounded-md transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    'dark:focus:ring-offset-slate-800',
    disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-700',
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <button
      type="button"
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={iconProps['aria-label']}
    >
      {loading ? (
        <Icon
          name="refresh"
          size={iconProps.size}
          color={iconProps.color}
          className="animate-spin"
          aria-hidden
        />
      ) : (
        <Icon {...iconProps} aria-hidden />
      )}
    </button>
  );
};

// Utility component for icon with text
interface IconWithTextProps extends IconProps {
  children: React.ReactNode;
  iconPosition?: 'left' | 'right';
  gap?: 'xs' | 'sm' | 'md' | 'lg';
}

export const IconWithText: React.FC<IconWithTextProps> = ({
  children,
  iconPosition = 'left',
  gap = 'sm',
  className = '',
  ...iconProps
}) => {
  const gapClasses = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  };
  
  const containerClasses = [
    'inline-flex items-center',
    gapClasses[gap],
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <span className={containerClasses}>
      {iconPosition === 'left' && <Icon {...iconProps} />}
      <span>{children}</span>
      {iconPosition === 'right' && <Icon {...iconProps} />}
    </span>
  );
};

// Utility component for status icons
interface StatusIconProps {
  status: 'success' | 'warning' | 'error' | 'info';
  size?: IconSize;
  className?: string;
  showBackground?: boolean;
}

export const StatusIcon: React.FC<StatusIconProps> = ({
  status,
  size = 'md',
  className = '',
  showBackground = false,
}) => {
  const statusConfig = {
    success: { icon: 'check-circle', color: 'success' as IconColor },
    warning: { icon: 'warning', color: 'warning' as IconColor },
    error: { icon: 'x-circle', color: 'error' as IconColor },
    info: { icon: 'info', color: 'info' as IconColor },
  };
  
  const config = statusConfig[status];
  
  const backgroundClasses = showBackground ? {
    success: 'bg-emerald-100 dark:bg-emerald-900/20 p-1 rounded-full',
    warning: 'bg-amber-100 dark:bg-amber-900/20 p-1 rounded-full',
    error: 'bg-red-100 dark:bg-red-900/20 p-1 rounded-full',
    info: 'bg-blue-100 dark:bg-blue-900/20 p-1 rounded-full',
  }[status] : '';
  
  return (
    <span className={`${backgroundClasses} ${className}`}>
      <Icon
        name={config.icon}
        size={size}
        color={config.color}
        variant="solid"
      />
    </span>
  );
};

// Export icon names for TypeScript autocomplete
export type IconName = keyof typeof iconRegistry;

// Export all available icon names
export const availableIcons = Object.keys(iconRegistry) as IconName[];

export default Icon; 