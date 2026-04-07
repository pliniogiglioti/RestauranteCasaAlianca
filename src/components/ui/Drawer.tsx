import type { ReactNode } from 'react'
import { Drawer } from 'vaul'

type DrawerDirection = 'top' | 'bottom' | 'left' | 'right'

interface AppDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  title?: string
  description?: string
  direction?: DrawerDirection
  contentClassName?: string
  overlayClassName?: string
  showHandle?: boolean
  handleOnly?: boolean
  dismissible?: boolean
  onAnimationEnd?: (open: boolean) => void
}

const CONTENT_POSITION: Record<DrawerDirection, string> = {
  bottom: 'fixed inset-x-0 bottom-0 z-50',
  top: 'fixed inset-x-0 top-0 z-50',
  left: 'fixed left-0 top-0 bottom-0 z-50',
  right: 'fixed right-0 top-0 bottom-0 z-50',
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function AppDrawer({
  open,
  onOpenChange,
  children,
  title,
  description,
  direction = 'bottom',
  contentClassName,
  overlayClassName,
  showHandle = false,
  handleOnly = false,
  dismissible = true,
  onAnimationEnd,
}: AppDrawerProps) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      direction={direction}
      handleOnly={handleOnly}
      dismissible={dismissible}
      onAnimationEnd={onAnimationEnd}
    >
      <Drawer.Portal>
        <Drawer.Overlay
          className={joinClasses(
            'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm',
            overlayClassName
          )}
        />

        <Drawer.Content
          className={joinClasses(
            CONTENT_POSITION[direction],
            'flex flex-col bg-white shadow-2xl outline-none',
            contentClassName
          )}
        >
          {title && <Drawer.Title className="sr-only">{title}</Drawer.Title>}
          {description && (
            <Drawer.Description className="sr-only">{description}</Drawer.Description>
          )}

          {showHandle && direction === 'bottom' && (
            <div className="flex justify-center pt-3 pb-1">
              <Drawer.Handle className="!h-1.5 !w-12 !rounded-full !bg-gray-300" />
            </div>
          )}

          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
