import type { ReactNode } from 'react';
import clsx from 'clsx';
import GlassModal from './GlassModal';

export type GlassBottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  position?: 'viewport' | 'container';
  usePortal?: boolean;
  dismissible?: boolean;
  showHeader?: boolean;
  showCloseButton?: boolean;
  zIndex?: number;
  className?: string;
  panelClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
};

export function GlassBottomSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  position = 'viewport',
  usePortal = position === 'viewport',
  dismissible = true,
  showHeader = true,
  showCloseButton = false,
  zIndex = 260,
  className,
  panelClassName,
  headerClassName,
  bodyClassName,
  footerClassName,
}: GlassBottomSheetProps) {
  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="md"
      dismissible={dismissible}
      showCloseButton={showHeader && showCloseButton}
      usePortal={usePortal}
      zIndex={zIndex}
      className={clsx(
        'items-end justify-center !p-0 sm:items-center sm:!p-6',
        position === 'container' && '!absolute',
        className,
      )}
      panelClassName={clsx(
        'liquid-glass-sheet !max-w-none !rounded-b-none !rounded-t-[2rem] border-x border-b-0 border-t !p-4 !pb-[calc(env(safe-area-inset-bottom)+1rem)] !pt-8 before:absolute before:left-1/2 before:top-3 before:h-1 before:w-10 before:-translate-x-1/2 before:rounded-full before:bg-[color:var(--ui-border-strong)] sm:!max-w-md sm:!rounded-[2rem] sm:border-b sm:!p-4 sm:!pt-8',
        panelClassName,
      )}
      headerClassName={clsx(
        showHeader ? '!pr-0 text-center' : 'sr-only',
        headerClassName,
      )}
      bodyClassName={clsx(showHeader ? undefined : '!mt-0', bodyClassName)}
      footerClassName={clsx('w-full', footerClassName)}
      backdropClassName="!bg-[color:var(--ui-scrim)] !backdrop-blur-md"
      footer={footer}
    >
      {children}
    </GlassModal>
  );
}

export default GlassBottomSheet;
