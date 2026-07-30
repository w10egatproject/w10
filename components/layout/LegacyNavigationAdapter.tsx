import type { ReactElement } from 'react';

import NavigationMenu from '@/components/navigation/NavigationMenu';

export interface LegacyNavigationAdapterProps {
  buttonClassName: string;
  accentClassName?: string;
  itemHoverClassName?: string;
}

export function LegacyNavigationAdapter({
  buttonClassName,
  accentClassName,
  itemHoverClassName,
}: LegacyNavigationAdapterProps): ReactElement {
  return (
    <NavigationMenu
      buttonClassName={buttonClassName}
      accentClassName={accentClassName}
      itemHoverClassName={itemHoverClassName}
    />
  );
}

export default LegacyNavigationAdapter;
