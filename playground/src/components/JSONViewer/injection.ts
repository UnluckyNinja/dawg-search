import type { InjectionKey } from 'vue';

export const jsonViewerKey = Symbol('jsonViewer') as InjectionKey<{
  withinJsonViewer: boolean;
  toggleNode: (path: string) => void;
  isExpanded: (path: string) => boolean;
  expandAll: boolean;
}>;