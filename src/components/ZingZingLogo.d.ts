import * as React from 'react';

export type ZingZingLogoVariant = 'dark' | 'light' | 'icon';

export interface ZingZingLogoProps {
  variant?: ZingZingLogoVariant;
  size?: number | string;
  className?: string;
}

export declare function ZingZingLogo(props: ZingZingLogoProps): React.JSX.Element;

export default ZingZingLogo;

