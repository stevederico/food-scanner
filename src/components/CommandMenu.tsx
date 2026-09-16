import { useEffect, useState, useCallback, type ComponentType } from 'react';
import { BookOpen, Camera, House, type LucideProps } from 'lucide-react';
import { getState } from '@stevederico/skateboard-ui/Context';
import { useSafeNavigate } from '@stevederico/skateboard-ui/Utilities';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@stevederico/skateboard-ui/shadcn/ui/command';

/** Page entry from constants.json's pages array. */
interface PageEntry {
  title: string;
  url: string;
  icon: string;
}

/** Known Lucide icons used by BXFood pages (constants.json kebab-case names). */
const ICON_MAP: Record<string, ComponentType<LucideProps>> = {
  house: House,
  camera: Camera,
  'book-open': BookOpen,
};

/**
 * Resolve a constants.json icon name to a Lucide component.
 *
 * @param name - Kebab-case Lucide icon name
 * @returns Icon component, or House as fallback
 */
function resolveIcon(name: string): ComponentType<LucideProps> {
  return ICON_MAP[name] ?? House;
}

/**
 * Global command menu activated via Cmd+K (Mac) or Ctrl+K (Windows).
 *
 * Renders a searchable command palette overlay that lists all app pages
 * from constants.json. Selecting a page navigates to its route under /app/.
 *
 * Uses cmdk under the hood via skateboard-ui's Command primitives.
 * The keyboard listener is global, so this component works regardless
 * of which route is currently active.
 *
 * @component
 * @returns Command dialog with page navigation
 *
 * @example
 * // Add to any layout or view — keyboard shortcut is global
 * <CommandMenu />
 */
export default function CommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useSafeNavigate();
  const { state } = getState();
  const pages: PageEntry[] = state.constants?.pages || [];

  useEffect(() => {
    /**
     * Toggle command menu on Cmd+K / Ctrl+K keydown.
     * @param e - Native keyboard event
     */
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * Navigate to the selected page and close the menu.
   * @param url - Route path relative to /app/
   */
  const handleSelect = useCallback(
    (url: string) => {
      navigate(`/app/${url}`);
      setOpen(false);
    },
    [navigate]
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Menu"
      description="Search and navigate to any page"
    >
      <Command className="rounded-lg">
        <CommandInput placeholder="Search pages..." />
        <CommandList className="p-2">
          <CommandEmpty>No pages found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {pages.map((page) => {
              const Icon = resolveIcon(page.icon);
              return (
                <CommandItem
                  key={page.url}
                  value={page.title}
                  onSelect={() => handleSelect(page.url)}
                  className="gap-3 px-3 py-2.5"
                >
                  <Icon size={16} className="shrink-0 text-muted-foreground" />
                  <span>{page.title}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
